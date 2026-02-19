const db = require('../models');
const Message = db.message;
const Room = db.room;
const redis = require('../config/redis.config');
const { signMessage } = require('../utils/hmac.util');

/**
 * Gửi tin nhắn
 * @route POST /api/v1/messages/send
 */
exports.sendMessage = async (req, res) => {
    try {
        const senderId = req.userId; // Từ auth middleware
        const { roomId, content, type = 'text' } = req.body;

        if (!roomId || !content) {
            return res.status(400).send({ message: "roomId and content are required" });
        }

        // Kiểm tra room có tồn tại và user có trong room không
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).send({ message: "Room not found" });
        }

        if (!room.members.includes(senderId)) {
            return res.status(403).send({ message: "You are not a member of this room" });
        }

        // Tạo message mới
        const newMessage = new Message({
            room: roomId,
            sender: senderId,
            content,
            type,
            readBy: [senderId], // Người gửi đã "đọc" tin nhắn của mình
        });

        await newMessage.save();

        // Cập nhật lastMessage của room
        room.lastMessage = newMessage._id;
        await room.save();

        // Populate để có đầy đủ thông tin
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'username fullName avatar')
            .populate('room', 'name roomType members')
            .lean();

        // PUBLISH event đến Redis để Socket.IO xử lý với HMAC signature
        // Use simple fields instead of populated message to ensure canonical string consistency
        const redisPayload = signMessage({
            eventType: 'new_message',
            chatRoomId: roomId,
            messageId: newMessage._id.toString(),
            senderId: senderId.toString(),
            content: content,
            type: type,
            timestamp: newMessage.createdAt.getTime(),
        });

        console.log('\n📤 [BACKEND] Publishing to Redis channel: mits_chat_event');
        console.log('🎯 [BACKEND] Event type:', redisPayload.eventType);
        console.log('🏠 [BACKEND] Room ID:', roomId);
        console.log('🔐 [BACKEND] HMAC signature:', redisPayload.signature.substring(0, 20) + '...');

        await redis.publish('mits_chat_event', JSON.stringify(redisPayload));
        console.log('✅ [BACKEND] Published to Redis successfully');

        res.status(201).send({
            message: populatedMessage,
            success: true,
        });
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).send({ message: err.message });
    }
};

/**
 * Lấy tin nhắn trong room
 * @route GET /api/v1/messages/:roomId
 */
exports.getMessages = async (req, res) => {
    try {
        const userId = req.userId;
        const { roomId } = req.params;
        const { limit = 50, before } = req.query; // Pagination

        // Kiểm tra user có trong room không
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).send({ message: "Room not found" });
        }

        if (!room.members.includes(userId)) {
            return res.status(403).send({ message: "Access denied" });
        }

        // Query messages
        const query = {
            room: roomId,
            isDeleted: false,
        };

        // Pagination: lấy tin nhắn trước một timestamp
        if (before) {
            query.createdAt = { $lt: new Date(before) };
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 }) // Mới nhất trước
            .limit(parseInt(limit))
            .populate('sender', 'username fullName avatar');

        res.status(200).send({
            messages: messages.reverse(), // Đảo lại để cũ nhất lên đầu
            hasMore: messages.length === parseInt(limit),
        });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

/**
 * Đánh dấu tin nhắn đã đọc
 * @route PUT /api/v1/messages/:messageId/read
 */
exports.markAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).send({ message: "Message not found" });
        }

        // Thêm userId vào readBy nếu chưa có
        if (!message.readBy.includes(userId)) {
            message.readBy.push(userId);
            await message.save();

            // Publish read receipt event with HMAC
            const readPayload = signMessage({
                eventType: 'message_read',
                chatRoomId: message.room.toString(),
                messageId,
                userId,
            });

            await redis.publish('mits_chat_event', JSON.stringify(readPayload));
        }

        res.status(200).send({ success: true });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

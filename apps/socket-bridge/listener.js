const { debugLog } = require('./utils.js');

function registerHandlers(ioInstance) {

    ioInstance.on('connection', (socket) => {
        const clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;

        // 1. Xác thực User (Thường lấy từ Handshake Auth Token)
        const userId = socket.handshake.auth.userId;

        if (!userId) {
            debugLog(clientIp, `Client connected without userId. ID: ${socket.id}`);
            // Có thể disconnect nếu bắt buộc phải login
            // socket.disconnect(); 
            // return;
        } else {
            debugLog(clientIp, `User connected: ${userId} (Socket: ${socket.id})`);

            // 2. Join kênh cá nhân (Quan trọng để nhận thông báo riêng)
            socket.join(`user:${userId}`);
            socket.data.userId = userId;
        }

        // 3. Client chủ động xin Join Room (Khi user bấm vào đoạn chat)
        socket.on('joinRoom', (data) => {
            try {
                // data: { chatRoomId: "123" }
                const { chatRoomId } = data;
                if (!chatRoomId) return;

                const fullRoomId = `group:${chatRoomId}`;

                // Logic: Leave các room group cũ để tránh nhận tin nhắn rác (nếu muốn logic focus 1 room)
                // Hoặc giữ nguyên nếu muốn nhận tin nhắn real-time của nhiều room nền.
                // Ở đây tôi giữ logic join nhiều room.

                socket.join(fullRoomId);
                debugLog(clientIp, `User ${userId} joined ${fullRoomId}`);

                // Phản hồi lại client là đã join thành công
                socket.emit('joinedRoom', { roomId: chatRoomId, status: 'success' });

            } catch (err) {
                debugLog(clientIp, `Error joining room: ${err.message}`);
            }
        });

        // 4. Client xin Leave Room
        socket.on('leaveRoom', (data) => {
            const { chatRoomId } = data;
            if (chatRoomId) {
                socket.leave(`group:${chatRoomId}`);
            }
        });

        // 5. Typing Events (Client gõ phím -> Server Broadcast ngay cho nhẹ, không cần qua Redis API)
        // Tuy nhiên nếu bạn muốn đồng bộ 100% qua API thì bỏ đoạn này đi và gọi API /typing
        socket.on('clientTyping', (data) => {
            const { chatRoomId } = data;
            if (chatRoomId) {
                socket.to(`group:${chatRoomId}`).emit('userTyping', {
                    userId: userId,
                    chatRoomId: chatRoomId
                });
            }
        });

        socket.on('clientStopTyping', (data) => {
            const { chatRoomId } = data;
            if (chatRoomId) {
                socket.to(`group:${chatRoomId}`).emit('userStopTyping', {
                    userId: userId,
                    chatRoomId: chatRoomId
                });
            }
        });

        socket.on('disconnect', () => {
            // debugLog(clientIp, `Client disconnected: ${socket.id}`);
        });
    });
}

module.exports = { registerHandlers };
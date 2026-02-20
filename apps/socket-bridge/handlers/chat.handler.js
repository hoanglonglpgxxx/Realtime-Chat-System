const { debugLog } = require('../utils.js');

/**
 * Simple chat event handler (no HMAC security for MVP)
 * Handles events from Express API via Redis pub/sub
 */
exports.subscribeChatEvents = (io, subClient) => {
    const CHAT_CHANNEL = 'chat:events';

    subClient.subscribe(CHAT_CHANNEL, async (rawMessage) => {
        try {
            const message = JSON.parse(rawMessage);
            const { event, data } = message;

            debugLog('CHAT_EVENT', `Received '${event}' event`);

            switch (event) {
                case 'new_message':
                    handleNewMessage(io, data);
                    break;

                case 'message_read':
                    handleMessageRead(io, data);
                    break;

                case 'typing':
                    handleTyping(io, data);
                    break;

                case 'stop_typing':
                    handleStopTyping(io, data);
                    break;

                default:
                    debugLog('WARN', `Unknown event type: ${event}`);
            }
        } catch (e) {
            debugLog('ERROR', 'Failed to parse chat event:', e.message);
        }
    });

    debugLog('SYSTEM', `Listening on channel: ${CHAT_CHANNEL}`);
};

/**
 * Broadcast tin nhắn mới đến tất cả members trong room
 */
function handleNewMessage(io, data) {
    const { message, roomId } = data;

    if (!message || !roomId) {
        debugLog('ERROR', 'Invalid new_message data');
        return;
    }

    // Emit đến room (tất cả users đã join room này)
    const roomName = `room:${roomId}`;
    io.to(roomName).emit('new_message', {
        message,
        timestamp: Date.now(),
    });

    debugLog('CHAT', `Broadcasted message to ${roomName}`);
}

/**
 * Thông báo tin nhắn đã được đọc
 */
function handleMessageRead(io, data) {
    const { messageId, userId, roomId } = data;

    if (!messageId || !userId || !roomId) {
        debugLog('ERROR', 'Invalid message_read data');
        return;
    }

    const roomName = `room:${roomId}`;
    io.to(roomName).emit('message_read', {
        messageId,
        userId,
        timestamp: Date.now(),
    });

    debugLog('CHAT', `Message ${messageId} read by ${userId}`);
}

/**
 * User đang typing
 */
function handleTyping(io, data) {
    const { userId, roomId, username } = data;

    if (!userId || !roomId) return;

    const roomName = `room:${roomId}`;
    // Broadcast đến tất cả EXCEPT người typing
    io.to(roomName).except(`user:${userId}`).emit('typing', {
        userId,
        username,
        roomId,
    });
}

/**
 * User ngừng typing
 */
function handleStopTyping(io, data) {
    const { userId, roomId } = data;

    if (!userId || !roomId) return;

    const roomName = `room:${roomId}`;
    io.to(roomName).except(`user:${userId}`).emit('stop_typing', {
        userId,
        roomId,
    });
}

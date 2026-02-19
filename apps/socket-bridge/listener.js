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
                // data: { roomId: "123" }
                const { roomId } = data;
                if (!roomId) return;

                const fullRoomId = `room:${roomId}`;

                // Join room để nhận tin nhắn real-time
                socket.join(fullRoomId);
                console.log('\n🔗 [JOIN] User', userId, 'joined room:', fullRoomId);
                debugLog(clientIp, `User ${userId} joined ${fullRoomId}`);

                // Phản hồi lại client là đã join thành công
                socket.emit('joinedRoom', { roomId, status: 'success' });
                console.log('✅ [JOIN] Confirmation sent to client');

            } catch (err) {
                debugLog(clientIp, `Error joining room: ${err.message}`);
            }
        });

        // 4. Client xin Leave Room
        socket.on('leaveRoom', (data) => {
            const { roomId } = data;
            if (roomId) {
                socket.leave(`room:${roomId}`);
                debugLog(clientIp, `User ${userId} left room:${roomId}`);
            }
        });

        // 5. Typing Events (Client gõ phím -> Server Broadcast ngay)
        socket.on('typing', (data) => {
            const { roomId } = data;
            if (roomId && userId) {
                socket.to(`room:${roomId}`).emit('typing', {
                    userId,
                    roomId,
                    username: socket.data.username || 'User'
                });
            }
        });

        socket.on('stop_typing', (data) => {
            const { roomId } = data;
            if (roomId && userId) {
                socket.to(`room:${roomId}`).emit('stop_typing', {
                    userId,
                    roomId
                });
            }
        });

        socket.on('disconnect', () => {
            // debugLog(clientIp, `Client disconnected: ${socket.id}`);
        });
    });
}

module.exports = { registerHandlers };
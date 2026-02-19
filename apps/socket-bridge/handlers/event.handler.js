const crypto = require('crypto');
const { APP_SECRET_KEY, config } = require('../config.js');
const { debugLog } = require('../utils.js');

const NONCE_TTL_SECONDS = 60;
const MAX_TIME_DIFF_SECONDS = 60;

// Danh sách các event hợp lệ mà Express API được phép trigger
const ALLOWED_EVENTS = [
    'newMsg', 'userTyping', 'userStopTyping',
    'deleteMsg', 'pinMsg', 'editMsg', 'reactMsg',
    'roomUpdated', 'notification', 'forceJoinRoom',
    // Chat events mới
    'new_message', 'message_read', 'typing', 'stop_typing'
];

// --- Helper Functions ---
function sortObject(obj) {
    if (Array.isArray(obj)) return obj.map(sortObject);
    if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).sort().reduce((sorted, key) => {
            sorted[key] = sortObject(obj[key]);
            return sorted;
        }, {});
    }
    return obj;
}

async function isNonceUsed(pubClient, nonce) {
    const NONCE_KEY = `chat:nonce:${nonce}`;
    // SET NX: chỉ set nếu chưa tồn tại. EX: hết hạn sau 60s
    const result = await pubClient.set(NONCE_KEY, '1', { NX: true, EX: NONCE_TTL_SECONDS });
    return result === null; // Nếu null nghĩa là key đã tồn tại -> Nonce đã dùng
}

function verifyHMAC(payload, receivedSignature, secret) {
    try {
        let dataToVerify = typeof payload === 'string' ? JSON.parse(payload) : { ...payload };
        if (dataToVerify.signature) delete dataToVerify.signature;

        const sortedData = sortObject(dataToVerify);
        // Lưu ý: Cần thống nhất cách replace slash với bên Express API
        let canonicalString = JSON.stringify(sortedData).replace(/\//g, '\\/');

        console.log('🔐 [HMAC-VERIFY] Secret key (first 10 chars):', secret.substring(0, 10));
        console.log('📝 [HMAC-VERIFY] Canonical string (first 200 chars):', canonicalString.substring(0, 200));

        const expectedSignature = crypto.createHmac('sha256', secret)
            .update(canonicalString)
            .digest('hex');

        console.log('🎯 [HMAC-VERIFY] Expected signature:', expectedSignature.substring(0, 20) + '...');
        console.log('📨 [HMAC-VERIFY] Received signature:', receivedSignature.substring(0, 20) + '...');
        console.log('🔍 [HMAC-VERIFY] Signatures match:', expectedSignature === receivedSignature);

        return crypto.timingSafeEqual(
            Buffer.from(receivedSignature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (e) {
        console.error("❌ [HMAC-VERIFY] Error:", e.message);
        debugLog("HMAC Error:", e.message);
        return false;
    }
}

// --- Main Handler ---
exports.subscribeAndVerifyEvents = (io, pubClient, subClient) => {
    // Sub riêng một kết nối Redis khác để lắng nghe event từ API
    // Lưu ý: subClient truyền vào từ connection.js đang dùng cho Adapter, 
    // nên ta cần duplicate hoặc dùng chung cẩn thận. Ở đây ta dùng subClient đã có.

    subClient.subscribe(config.redisChannel, async (rawMessage) => {
        console.log('\n🔔 [REDIS] Raw message received from channel:', config.redisChannel);
        console.log('📦 [REDIS] Raw payload:', rawMessage.substring(0, 200));

        let message;
        try {
            message = JSON.parse(rawMessage);
        } catch (e) {
            debugLog('ALERT', '❌ Invalid JSON from Redis:', rawMessage);
            return;
        }

        const { nonce, eventTime, signature, eventType, ...payload } = message;
        console.log('🔍 [HMAC] Checking event:', eventType, 'roomId:', payload.chatRoomId);

        // 1. Security Checks (Bảo vệ Socket Server khỏi fake events)
        const timeDifference = Math.abs(Date.now() / 1000 - eventTime);
        if (timeDifference > MAX_TIME_DIFF_SECONDS) {
            console.log('❌ [HMAC] Timestamp rejected. Diff:', timeDifference + 's');
            return;
        }
        console.log('✅ [HMAC] Timestamp valid');

        if (await isNonceUsed(pubClient, nonce)) {
            console.log('❌ [HMAC] Replay attack detected. Nonce:', nonce);
            return;
        }
        console.log('✅ [HMAC] Nonce valid');

        if (!verifyHMAC(message, signature, APP_SECRET_KEY)) {
            console.log('❌ [HMAC] Invalid signature');
            return;
        }
        console.log('✅ [HMAC] Signature verified!');

        // 2. Event Processing
        debugLog('REDIS_EVENT', `Received '${eventType}' for room '${payload.chatRoomId || 'GLOBAL'}'`);

        if (ALLOWED_EVENTS.includes(eventType)) {
            // Chuẩn hóa payload để bắn xuống Client
            const finalPayload = {
                ...payload,
                eventType: eventType,
                timestamp: Date.now()
            };

            const fullRoomId = payload.chatRoomId ? `room:${payload.chatRoomId}` : null;

            // For new_message event, reconstruct message object from simple fields
            if (eventType === 'new_message' && payload.messageId) {
                finalPayload.message = {
                    _id: payload.messageId,
                    room: payload.chatRoomId,
                    sender: payload.senderInfo || payload.senderId, // Use populated sender if available
                    content: payload.content,
                    type: payload.type,
                    createdAt: new Date(payload.timestamp),
                };
                console.log('📝 [SOCKET] Reconstructed message from simple fields');
            }

            // CASE A: Force Join (API yêu cầu User join room ngay lập tức)
            if (eventType === 'forceJoinRoom') {
                const { userIds, room } = payload;
                if (userIds && room) {
                    userIds.forEach(uid => {
                        // Tìm socket của user và join room
                        io.in(`user:${uid}`).socketsJoin(`room:${room}`);
                    });
                    debugLog('ACTION', `Forced ${userIds.length} users to join room:${room}`);
                }
                return;
            }

            // CASE B: Broadcast vào Room
            if (fullRoomId) {
                console.log('📢 [SOCKET] Emitting to room:', fullRoomId);
                console.log('📤 [SOCKET] Event type:', eventType);
                console.log('📦 [SOCKET] Payload:', JSON.stringify(finalPayload).substring(0, 200));

                // Emit sự kiện chính vào Room
                const socketsInRoom = await io.in(fullRoomId).fetchSockets();
                console.log('👥 [SOCKET] Sockets in room ' + fullRoomId + ':', socketsInRoom.length);

                io.to(fullRoomId).emit(eventType, finalPayload);
                console.log('✅ [SOCKET] Event emitted!');

                // Logic thông báo (Notification) cho người không online trong room
                // (Logic này tùy thuộc vào việc Client có join room hay chưa)
                if (payload.notifyUserIds && Array.isArray(payload.notifyUserIds)) {
                    payload.notifyUserIds.forEach(uid => {
                        // Bắn sự kiện riêng vào kênh cá nhân user
                        io.to(`user:${uid}`).emit('roomNotification', finalPayload);
                    });
                }
            } else {
                // CASE C: Broadcast Global (Cẩn thận khi dùng)
                io.emit(eventType, finalPayload);
            }
        }
    });

    debugLog('SYSTEM', `Listening on Redis Channel: ${config.redisChannel}`);
};
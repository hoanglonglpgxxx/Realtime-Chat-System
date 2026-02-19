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

        const expectedSignature = crypto.createHmac('sha256', secret)
            .update(canonicalString)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(receivedSignature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    } catch (e) {
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
        let message;
        try {
            message = JSON.parse(rawMessage);
        } catch (e) {
            debugLog('ALERT', 'Invalid JSON from Redis:', rawMessage);
            return;
        }

        const { nonce, eventTime, signature, eventType, ...payload } = message;

        // 1. Security Checks (Bảo vệ Socket Server khỏi fake events)
        const timeDifference = Math.abs(Date.now() / 1000 - eventTime);
        if (timeDifference > MAX_TIME_DIFF_SECONDS) {
            debugLog('ALERT', `Timestamp rejected. Diff: ${timeDifference}s`);
            return;
        }

        if (await isNonceUsed(pubClient, nonce)) {
            debugLog('ALERT', `Replay attack detected. Nonce: ${nonce}`);
            return;
        }

        if (!verifyHMAC(message, signature, APP_SECRET_KEY)) {
            debugLog('ALERT', 'Invalid Signature from Redis message');
            return;
        }

        // 2. Event Processing
        debugLog('REDIS_EVENT', `Received '${eventType}' for room '${payload.chatRoomId || 'GLOBAL'}'`);

        if (ALLOWED_EVENTS.includes(eventType)) {
            // Chuẩn hóa payload để bắn xuống Client
            const finalPayload = {
                ...payload,
                eventType: eventType,
                timestamp: Date.now()
            };

            const fullRoomId = payload.chatRoomId ? `group:${payload.chatRoomId}` : null;

            // CASE A: Force Join (API yêu cầu User join room ngay lập tức)
            if (eventType === 'forceJoinRoom') {
                const { userIds, room } = payload;
                if (userIds && room) {
                    userIds.forEach(uid => {
                        // Tìm socket của user và join room
                        io.in(`user:${uid}`).socketsJoin(`group:${room}`);
                    });
                    debugLog('ACTION', `Forced ${userIds.length} users to join group:${room}`);
                }
                return;
            }

            // CASE B: Broadcast vào Room
            if (fullRoomId) {
                // Emit sự kiện chính vào Room
                io.to(fullRoomId).emit(eventType, finalPayload);

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
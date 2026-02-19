const { getLocalIP, debugLog } = require('./utils.js');
const { config } = require('./config.js');
const { initializeServer } = require('./connection.js');
const { subscribeAndVerifyEvents } = require('./handlers/event.handler.js');
const { subscribeChatEvents } = require('./handlers/chat.handler.js');
const { registerHandlers } = require('./listener.js');

async function startServer() {
    try {
        const ip = getLocalIP();

        // 1. Khởi tạo kết nối
        const { app, server, io, pubClient, subClient } = await initializeServer();

        // 2a. Lắng nghe Redis Event từ Express API (Backend Trigger) - Original events
        const redisSubForEvents = pubClient.duplicate();
        await redisSubForEvents.connect();
        subscribeAndVerifyEvents(io, pubClient, redisSubForEvents);

        // 2b. Lắng nghe Chat Events (Simple pub/sub, no HMAC)
        const redisSubForChat = pubClient.duplicate();
        await redisSubForChat.connect();
        subscribeChatEvents(io, redisSubForChat);

        // 3. Lắng nghe Client Socket Events (Join room, Typing...)
        registerHandlers(io);

        // 4. Start Server
        server.listen(config.port, "0.0.0.0", () => {
            debugLog(ip, `Socket Server listening on port ${config.port}`);
            debugLog(ip, `Mode: 'HTTP/WS'`);
        });

    } catch (err) {
        debugLog('NO_ADDR', 'Failed to start server:', err);
    }
}

startServer();
const { getLocalIP, debugLog } = require('./utils.js');
const { config } = require('./config.js');
const { initializeServer } = require('./connection.js');
const { subscribeAndVerifyEvents } = require('./eventHandler.js');
const { registerHandlers } = require('./listeners.js');

async function startServer() {
    try {
        const ip = getLocalIP();

        // 1. Khởi tạo kết nối
        const { app, server, io, pubClient, subClient } = await initializeServer();

        // 2. Lắng nghe Redis Event từ Express API (Backend Trigger)
        // Lưu ý: subClient cần duplicate ở eventHandler nếu dùng chung với Adapter
        // Nhưng ở connection.js ta đã tạo riêng, nên truyền vào đây.
        const redisSubForEvents = pubClient.duplicate();
        await redisSubForEvents.connect();

        subscribeAndVerifyEvents(io, pubClient, redisSubForEvents);

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
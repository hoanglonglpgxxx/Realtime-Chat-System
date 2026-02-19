const fs = require('fs');
const express = require('express');
const http = require('http');
const https = require('https');
const socketio = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const { debugLog } = require('./utils.js');
const { config } = require('./config.js');

async function initializeServer() {
    const app = express();
    app.use(express.json());
    let server;

    // --- Server setup (HTTP/HTTPS) ---
    try {
        server = http.createServer(app);
        debugLog("NO_ADDR", "Running in HTTP mode");
    } catch (err) {
        server = http.createServer(app);
    }

    // --- Redis Client Setup ---
    let io, pubClient, subClient;
    try {
        // Cấu trúc URL Redis: redis://:password@host:port
        const redisUrl = `redis://${config.redisPassword ? ':' + config.redisPassword + '@' : ''}${config.redisHost}:${config.redisPort}`;

        const clientOptions = {
            url: redisUrl,
            socket: { keepAlive: 60000 }
        };

        pubClient = createClient(clientOptions);
        subClient = pubClient.duplicate();

        pubClient.on('error', (err) => debugLog('NO_ADDR', 'Redis pubClient error:', err));
        subClient.on('error', (err) => debugLog('NO_ADDR', 'Redis subClient error:', err));

        await Promise.all([pubClient.connect(), subClient.connect()]);
        debugLog('NO_ADDR', 'Redis clients connected successfully');

        // Socket.IO Setup với Redis Adapter (để scale nhiều node nếu cần)
        io = socketio(server, {
            path: '/socket.io', // Must match client path and nginx location
            cors: { origin: "*" }, // Chú ý: Production nên limit origin
            adapter: createAdapter(pubClient, subClient),
            transports: ['websocket', 'polling']
        });

        // Debug middleware
        io.engine.on("initial_headers", (headers, req) => {
            debugLog(req.connection.remoteAddress, `Socket.IO initial request from ${req.url}`);
        });

        io.engine.on("connection_error", (err) => {
            debugLog('NO_ADDR', `Socket.IO connection error: ${err.message}`);
        });

        debugLog('NO_ADDR', `Socket.IO initialized with path: /socket.io`);

        // Test API endpoint để check health
        app.get('/', (req, res) => res.send('Socket Server is Running'));

        return { app, server, io, pubClient, subClient };

    } catch (err) {
        debugLog('NO_ADDR', 'FATAL: Redis connection failed:', err.message);
        process.exit(1);
    }
}

module.exports = { initializeServer };
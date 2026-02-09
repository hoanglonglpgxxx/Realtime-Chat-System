const fs = require('fs');
const express = require('express');
const http = require('http');
const https = require('https');
const socketio = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const { debugLog } = require('./utils.js');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: '../../.env' });
}


async function initializeServer() {
    const app = express();
    app.use(express.json());
    let server;

    // --- Server setup ---
    try {
        if (fs.existsSync(process.env.SSL_KEY) && fs.existsSync(process.env.SSL_CERT)) {
            const options = {
                key: fs.readFileSync(process.env.SSL_KEY),
                cert: fs.readFileSync(process.env.SSL_CERT)
            };
            server = https.createServer(options, app);
            debugLog("NO_ADDR", "Running in HTTPS mode");
        } else {
            throw new Error("SSL files not found");
        }
    } catch (err) {
        debugLog("NO_ADDR", "SSL not found or invalid, fallback to HTTP:", err.message);
        server = http.createServer(app);
    }

    // --- Socket.IO và Redis setup ---
    let io, pubClient, subClient;
    try {
        const redisUrl = `redis://default:${process.env.REDIS_PASS}@${process.env.REDIS_PASS}:${process.env.REDIS_PORT}`;
        const clientOptions = {
            url: redisUrl,
            socket: { keepAlive: 60000 }
        };

        pubClient = createClient(clientOptions);
        subClient = pubClient.duplicate();

        pubClient.on('error', (err) => debugLog('NO_ADDR', 'Redis pubClient error:', err));
        subClient.on('error', (err) => debugLog('NO_ADDR', 'Redis subClient error:', err));

        await Promise.all([pubClient.connect(), subClient.connect()]);
        debugLog('NO_ADDR', 'Redis clients connected');

        const adapter = createAdapter(pubClient, subClient, { key: 'vsystem_chat_bus' });

        io = socketio(server, {
            cors: { origin: "*" },
            adapter: adapter,
            allowEIO3: true,
            transports: ['polling', 'websocket'],
            pingTimeout: 60000,
            pingInterval: 25000
        });

        debugLog('NO_ADDR', 'Connected to Redis adapter with key: vsystem_chat_bus');

        // Log tin nhắn nhận qua Redis
        io.of("/").adapter.on("message", (channel, message) => {
            debugLog("NO_ADDR", "Redis message received:", channel, message);
        });

        return { app, server, io, pubClient, subClient };

    } catch (err) {
        console.error('Redis connection failed:', err.message);
    }
}

module.exports = { initializeServer };
const { createClient } = require('redis');

// Build Redis URL from separate env vars (like socket-bridge)
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;
const redisPassword = process.env.REDIS_PASS || '';

const redisUrl = `redis://${redisPassword ? ':' + redisPassword + '@' : ''}${redisHost}:${redisPort}`;

console.log(`[REDIS-CONFIG] Connecting to Redis: ${redisHost}:${redisPort}`);

// Tạo Redis client cho pub/sub
const redisClient = createClient({
    url: redisUrl,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('[REDIS-CONFIG] Redis connection failed after 10 retries');
                return new Error('Redis connection failed');
            }
            return retries * 500; // Exponential backoff
        }
    }
});

redisClient.on('error', (err) => {
    console.error('[REDIS-CONFIG] Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('[REDIS-CONFIG] Redis Client Connected');
});

redisClient.on('ready', () => {
    console.log('[REDIS-CONFIG] Redis Client Ready');
});

// Connect
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
})();

module.exports = redisClient;

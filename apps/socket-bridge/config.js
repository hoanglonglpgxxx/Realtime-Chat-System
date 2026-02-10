const fs = require('fs');
const { debugLog } = require('./utils.js');

// --- Config ---
const config = {
    redisHost: process.env.REDIS_HOST || "localhost",
    redisPort: process.env.REDIS_PORT || 6379,
    redisPassword: process.env.REDIS_PASSWORD || "",
    secretKey: process.env.SECRET_KEY_PATH || "", // Đường dẫn file chứa Key bảo mật
    port: process.env.PORT || 3000,
    // Channel Redis dùng để giao tiếp giữa Express API và Socket Server
    redisChannel: 'vsystem_chat_event'
};

// --- Validate Config ---
if (!config.redisHost) {
    debugLog("ERROR: Missing Redis Host. Exiting.");
    process.exit(1);
} else {
    debugLog(`Config loaded. Redis: ${config.redisHost}:${config.redisPort}`);
}

// --- Load Secret Key (Dùng để verify message từ Express API) ---
let APP_SECRET_KEY = 'DEFAULT_SECRET_KEY_DEV'; // Fallback cho dev
try {
    if (config.secretKey && fs.existsSync(config.secretKey)) {
        APP_SECRET_KEY = fs.readFileSync(config.secretKey, 'utf8').trim();
        debugLog('NO_ADDR', 'Successfully loaded secret key from file.');
    } else if (process.env.APP_SECRET_KEY) {
        APP_SECRET_KEY = process.env.APP_SECRET_KEY;
        debugLog('NO_ADDR', 'Loaded secret key from ENV.');
    }
} catch (err) {
    debugLog('NO_ADDR', 'WARNING: Could not read secretKey file.', err.message);
}

module.exports = {
    config,
    APP_SECRET_KEY
};
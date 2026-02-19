const fs = require('fs');
const crypto = require('crypto');
const { debugLog } = require('./utils.js');

// --- Config ---
const config = {
    redisHost: process.env.REDIS_HOST || "localhost",
    redisPort: process.env.REDIS_PORT || 6379,
    redisPassword: process.env.REDIS_PASSWORD || "",
    secretKey: process.env.SECRET_KEY_PATH || "", // Đường dẫn file chứa Key bảo mật
    port: process.env.PORT || 3000,
    // Channel Redis dùng để giao tiếp giữa Express API và Socket Server
    redisChannel: 'mits_chat_event'
};

// --- Validate Config ---
if (!config.redisHost) {
    debugLog("ERROR: Missing Redis Host. Exiting.");
    process.exit(1);
} else {
    debugLog(`Config loaded. Redis: ${config.redisHost}:${config.redisPort}`);
}

// --- Load Secret Key (Dùng để verify message từ Express API) ---
let APP_SECRET_KEY = process.env.HMAC_SECRET_KEY || process.env.APP_SECRET_KEY;

// Priority 2: Đọc từ file nếu có SECRET_KEY_PATH
if (!APP_SECRET_KEY && config.secretKey && fs.existsSync(config.secretKey)) {
    try {
        APP_SECRET_KEY = fs.readFileSync(config.secretKey, 'utf8').trim();
        debugLog('NO_ADDR', '✅ HMAC secret loaded from file:', config.secretKey);
    } catch (err) {
        debugLog('NO_ADDR', 'WARNING: Could not read secretKey file.', err.message);
    }
}

// Priority 3: Auto-generate và lưu vào file shared
if (!APP_SECRET_KEY) {
    const autoSecretPath = '/app/shared/hmac-secret.key';
    try {
        if (fs.existsSync(autoSecretPath)) {
            APP_SECRET_KEY = fs.readFileSync(autoSecretPath, 'utf8').trim();
            debugLog('NO_ADDR', '✅ HMAC secret loaded from auto-generated file');
        } else {
            APP_SECRET_KEY = crypto.randomBytes(32).toString('hex');
            fs.mkdirSync(require('path').dirname(autoSecretPath), { recursive: true });
            fs.writeFileSync(autoSecretPath, APP_SECRET_KEY, { mode: 0o400 });
            debugLog('NO_ADDR', '🔑 Auto-generated HMAC secret:', autoSecretPath);
            debugLog('NO_ADDR', '⚠️  Copy to .env as HMAC_SECRET_KEY:', APP_SECRET_KEY);
        }
    } catch (err) {
        debugLog('NO_ADDR', '⚠️  Cannot auto-generate secret:', err.message);
    }
}

// Priority 4: Fallback cuối cùng (INSECURE)
if (!APP_SECRET_KEY) {
    APP_SECRET_KEY = 'INSECURE_FALLBACK_' + crypto.randomBytes(16).toString('hex');
    debugLog('NO_ADDR', '⚠️  WARNING: Using random fallback HMAC key!');
    debugLog('NO_ADDR', '⚠️  Set HMAC_SECRET_KEY env var for production!');
}

module.exports = {
    config,
    APP_SECRET_KEY
};
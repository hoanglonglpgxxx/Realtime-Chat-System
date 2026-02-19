const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Load secret key từ file hoặc env
let SECRET_KEY = process.env.HMAC_SECRET_KEY;

// Priority 2: Đọc từ file nếu có SECRET_KEY_PATH
if (!SECRET_KEY && process.env.SECRET_KEY_PATH) {
    try {
        const secretPath = path.resolve(process.env.SECRET_KEY_PATH);
        SECRET_KEY = fs.readFileSync(secretPath, 'utf8').trim();
        console.log('✅ HMAC secret loaded from file:', secretPath);
    } catch (err) {
        console.warn('⚠️  Cannot load HMAC secret key from file:', err.message);
    }
}

// Priority 3: Auto-generate và lưu vào file shared (nếu có volume mount)
if (!SECRET_KEY) {
    const autoSecretPath = '/app/shared/hmac-secret.key';
    try {
        // Kiểm tra xem file có sẵn chưa
        if (fs.existsSync(autoSecretPath)) {
            SECRET_KEY = fs.readFileSync(autoSecretPath, 'utf8').trim();
            console.log('✅ HMAC secret loaded from auto-generated file');
        } else {
            // Tạo mới secret và lưu
            SECRET_KEY = crypto.randomBytes(32).toString('hex');
            fs.mkdirSync(path.dirname(autoSecretPath), { recursive: true });
            fs.writeFileSync(autoSecretPath, SECRET_KEY, { mode: 0o400 });
            console.log('🔑 Auto-generated HMAC secret and saved to:', autoSecretPath);
            console.log('⚠️  IMPORTANT: Copy this to your .env as HMAC_SECRET_KEY:', SECRET_KEY);
        }
    } catch (err) {
        console.warn('⚠️  Cannot auto-generate secret file:', err.message);
    }
}

// Priority 4: Fallback cuối cùng (INSECURE)
if (!SECRET_KEY) {
    SECRET_KEY = 'INSECURE_FALLBACK_KEY_' + crypto.randomBytes(16).toString('hex');
    console.warn('⚠️  WARNING: Using random fallback key (will change on restart!)');
    console.warn('⚠️  Set HMAC_SECRET_KEY env var for production!');
    console.warn('⚠️  Generated key:', SECRET_KEY);
}

console.log('🔑 [BACKEND-HMAC] Secret Key loaded (first 10 chars):', SECRET_KEY.substring(0, 10));
console.log('🔑 [BACKEND-HMAC] Secret Key source:', process.env.HMAC_SECRET_KEY ? 'ENV VAR' : 'AUTO-GENERATED or FALLBACK');

/**
 * Sort object để đảm bảo canonical string nhất quán
 */
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

/**
 * Sign message với HMAC SHA256
 * @param {Object} payload - Message payload
 * @returns {Object} - Payload with signature, nonce, eventTime
 */
function signMessage(payload) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const eventTime = Math.floor(Date.now() / 1000);

    const messageToSign = {
        ...payload,
        nonce,
        eventTime,
    };

    // Sort để tạo canonical string
    const sortedData = sortObject(messageToSign);
    const canonicalString = JSON.stringify(sortedData).replace(/\//g, '\\/');

    // Tạo HMAC signature
    const signature = crypto.createHmac('sha256', SECRET_KEY)
        .update(canonicalString)
        .digest('hex');

    console.log('🔐 [HMAC-SIGN] Secret key (first 10 chars):', SECRET_KEY.substring(0, 10));
    console.log('📝 [HMAC-SIGN] Canonical string (first 200 chars):', canonicalString.substring(0, 200));
    console.log('🎯 [HMAC-SIGN] Generated signature:', signature.substring(0, 20) + '...');

    return {
        ...messageToSign,
        signature,
    };
}

module.exports = {
    signMessage,
    SECRET_KEY,
};

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
        console.log('HMAC secret loaded from file:', secretPath);
    } catch (err) {
        console.warn('Cannot load HMAC secret key from file:', err.message);
    }
}

// Priority 3: Auto-generate và lưu vào file shared (nếu có volume mount)
if (!SECRET_KEY) {
    const autoSecretPath = '/app/shared/hmac-secret.key';
    try {
        // Kiểm tra xem file có sẵn chưa
        if (fs.existsSync(autoSecretPath)) {
            SECRET_KEY = fs.readFileSync(autoSecretPath, 'utf8').trim();
            console.log('HMAC secret loaded from auto-generated file');
        } else {
            // Tạo mới secret và lưu
            SECRET_KEY = crypto.randomBytes(32).toString('hex');
            fs.mkdirSync(path.dirname(autoSecretPath), { recursive: true });
            fs.writeFileSync(autoSecretPath, SECRET_KEY, { mode: 0o400 });
            console.log('Auto-generated HMAC secret and saved to:', autoSecretPath);
            console.log('IMPORTANT: Copy this to your .env as HMAC_SECRET_KEY:', SECRET_KEY);
        }
    } catch (err) {
        console.warn('Cannot auto-generate secret file:', err.message);
    }
}

// Priority 4: Fallback cuối cùng (INSECURE)
if (!SECRET_KEY) {
    SECRET_KEY = 'INSECURE_FALLBACK_KEY_' + crypto.randomBytes(16).toString('hex');
    console.warn('WARNING: Using random fallback key (will change on restart!)');
    console.warn('Set HMAC_SECRET_KEY env var for production!');
    console.warn('Generated key:', SECRET_KEY);
}

console.log('[BACKEND-HMAC] Secret Key loaded (first 10 chars):', SECRET_KEY.substring(0, 10));
console.log('[BACKEND-HMAC] Secret Key source:', process.env.HMAC_SECRET_KEY ? 'ENV VAR' : 'AUTO-GENERATED or FALLBACK');

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

    console.log('[HMAC-SIGN] Secret key (first 10 chars):', SECRET_KEY.substring(0, 10));
    console.log('[HMAC-SIGN] Canonical string (first 200 chars):', canonicalString.substring(0, 200));
    console.log('[HMAC-SIGN] Generated signature:', signature.substring(0, 20) + '...');

    return {
        ...messageToSign,
        signature,
    };
}

/**
 * Verify HMAC signature và nonce uniqueness
 * @param {Object} payload - Message với signature, nonce, eventTime
 * @param {Object} redis - Redis client để check nonce
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function verifyMessage(payload, redis) {
    const { signature, nonce, eventTime, ...data } = payload;

    // 1. Check required fields
    if (!signature || !nonce || !eventTime) {
        return { valid: false, error: 'Missing signature, nonce, or eventTime' };
    }

    // 2. Check timestamp (±60 seconds tolerance)
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - eventTime);
    if (timeDiff > 60) {
        return { valid: false, error: `Timestamp expired (diff: ${timeDiff}s, max: 60s)` };
    }

    // 3. Verify HMAC signature
    const messageToVerify = {
        ...data,
        nonce,
        eventTime,
    };

    const sortedData = sortObject(messageToVerify);
    const canonicalString = JSON.stringify(sortedData).replace(/\//g, '\\/');

    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY)
        .update(canonicalString)
        .digest('hex');

    console.log('[HMAC-VERIFY] Expected signature:', expectedSignature.substring(0, 20) + '...');
    console.log('[HMAC-VERIFY] Received signature:', signature.substring(0, 20) + '...');

    if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid HMAC signature' };
    }

    // 4. Check nonce uniqueness (replay attack prevention)
    const nonceKey = `chat:nonce:${nonce}`;
    const nonceExists = await redis.get(nonceKey);

    if (nonceExists) {
        return { valid: false, error: 'Nonce already used (replay attack detected)' };
    }

    // 5. Store nonce with 60s TTL
    await redis.setex(nonceKey, 60, eventTime.toString());

    console.log('[HMAC-VERIFY] ✅ Signature valid, nonce stored:', nonceKey);

    return { valid: true };
}

module.exports = {
    signMessage,
    verifyMessage,
    SECRET_KEY,
};

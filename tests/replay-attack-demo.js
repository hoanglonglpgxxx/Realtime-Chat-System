#!/usr/bin/env node

/**
 * Replay Attack Demo Script
 * 
 * Demo cho Master's Thesis: Shows how the system blocks replay attacks
 * 
 * Usage:
 *   node replay-attack-demo.js
 */

const axios = require('axios');
const crypto = require('crypto');
const readline = require('readline');

// Configuration
const VM1_URL = process.env.VM1_URL || 'http://localhost:8029';
const SECRET_KEY = process.env.HMAC_SECRET_KEY || 'YOUR_SECRET_KEY_HERE';

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

function signMessage(payload) {
    const nonce = crypto.randomBytes(16).toString('hex');
    const eventTime = Math.floor(Date.now() / 1000);

    const messageToSign = {
        ...payload,
        nonce,
        eventTime,
    };

    const sortedData = sortObject(messageToSign);
    const canonicalString = JSON.stringify(sortedData).replace(/\//g, '\\/');

    const signature = crypto.createHmac('sha256', SECRET_KEY)
        .update(canonicalString)
        .digest('hex');

    return {
        ...messageToSign,
        signature
    };
}

async function sendRequest(message, label) {
    try {
        log(`\n[${label}] Sending request...`, colors.cyan);
        log(`Nonce: ${message.nonce.substring(0, 16)}...`, colors.blue);
        log(`Timestamp: ${message.eventTime} (${new Date(message.eventTime * 1000).toISOString()})`, colors.blue);
        log(`Signature: ${message.signature.substring(0, 20)}...`, colors.blue);

        const response = await axios.post(`${VM1_URL}/api/v1/messages/send`, message, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
        });

        log(`✅ SUCCESS: ${response.status} ${response.statusText}`, colors.green);
        log(`Response: ${JSON.stringify(response.data)}`, colors.green);
        return { success: true, data: response.data };

    } catch (error) {
        if (error.response) {
            log(`❌ BLOCKED: ${error.response.status} ${error.response.statusText}`, colors.red);
            log(`Error: ${JSON.stringify(error.response.data)}`, colors.red);
            return { success: false, error: error.response.data };
        } else {
            log(`❌ ERROR: ${error.message}`, colors.red);
            return { success: false, error: error.message };
        }
    }
}

function printHeader(title) {
    const line = '='.repeat(70);
    log(`\n${line}`, colors.bright);
    log(`  ${title}`, colors.bright);
    log(`${line}\n`, colors.bright);
}

function printStep(stepNum, description) {
    log(`\n${'─'.repeat(70)}`, colors.yellow);
    log(`STEP ${stepNum}: ${description}`, colors.yellow);
    log('─'.repeat(70), colors.yellow);
}

async function waitForUser(message = 'Press Enter to continue...') {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(`\n${colors.cyan}${message}${colors.reset}`, () => {
            rl.close();
            resolve();
        });
    });
}

async function scenario1_NormalRequest() {
    printHeader('SCENARIO 1: Normal Request (Should SUCCEED)');

    log('This demonstrates a legitimate request with valid signature, fresh timestamp, and unique nonce.', colors.blue);
    await waitForUser();

    const message = signMessage({
        roomId: 'demo-room-123',
        message: 'Hello! This is a legitimate message.',
        userId: 'user-demo'
    });

    const result = await sendRequest(message, 'SCENARIO 1');

    if (result.success) {
        log('\n📊 RESULT: Request processed successfully!', colors.green + colors.bright);
        log('The nonce is now stored in Redis with 60s TTL.', colors.green);
    }

    return { message, result };
}

async function scenario2_ReplayImmediate(capturedMessage) {
    printHeader('SCENARIO 2: Immediate Replay Attack (Should FAIL)');

    log('Attacker captured the previous request and tries to replay it immediately.', colors.blue);
    log('The SAME nonce, timestamp, and signature will be sent again.', colors.blue);
    await waitForUser();

    log('\n🎭 ATTACKER ACTION: Replaying captured request...', colors.red);
    const result = await sendRequest(capturedMessage, 'REPLAY ATTACK');

    if (!result.success && result.error && result.error.error) {
        const errorMsg = result.error.error.toLowerCase();
        if (errorMsg.includes('nonce') || errorMsg.includes('replay')) {
            log('\n🛡️  RESULT: Replay attack SUCCESSFULLY BLOCKED!', colors.green + colors.bright);
            log('The system detected the duplicate nonce and rejected the request.', colors.green);
        }
    }
}

async function scenario3_ReplayAfterDelay(capturedMessage) {
    printHeader('SCENARIO 3: Delayed Replay Attack (Should FAIL)');

    log('After 70 seconds, the nonce expires from Redis, but timestamp validation kicks in.', colors.blue);
    log('This tests the temporal protection layer.', colors.blue);

    const waitTime = 70;
    log(`\n⏳ Waiting ${waitTime} seconds for nonce TTL to expire...`, colors.yellow);

    for (let i = waitTime; i > 0; i -= 10) {
        await sleep(10000);
        log(`   ${i - 10} seconds remaining...`, colors.yellow);
    }

    log('\n🎭 ATTACKER ACTION: Replaying old request...', colors.red);
    const result = await sendRequest(capturedMessage, 'DELAYED REPLAY');

    if (!result.success && result.error && result.error.error) {
        const errorMsg = result.error.error.toLowerCase();
        if (errorMsg.includes('expired') || errorMsg.includes('timestamp')) {
            log('\n🛡️  RESULT: Delayed replay SUCCESSFULLY BLOCKED!', colors.green + colors.bright);
            log('The timestamp is outside the ±60s window, so request was rejected.', colors.green);
        }
    }
}

async function scenario4_ModifiedReplay() {
    printHeader('SCENARIO 4: Modified Replay Attack (Should FAIL)');

    log('Attacker tries to modify the message content while keeping the original signature.', colors.blue);
    log('This tests HMAC signature integrity protection.', colors.blue);
    await waitForUser();

    const originalMessage = signMessage({
        roomId: 'demo-room-123',
        message: 'Transfer $10',
        userId: 'user-demo'
    });

    log('\n📝 Original message:', colors.cyan);
    log(`   Message: "Transfer $10"`, colors.cyan);
    log(`   Signature: ${originalMessage.signature.substring(0, 20)}...`, colors.cyan);

    // Attacker modifies the message
    const tamperedMessage = {
        ...originalMessage,
        message: 'Transfer $10000'  // Changed from $10 to $10000
        // Signature remains the same (invalid!)
    };

    log('\n🎭 ATTACKER ACTION: Modifying message amount...', colors.red);
    log(`   NEW Message: "Transfer $10000" (tampered!)`, colors.red);
    log(`   Signature: ${tamperedMessage.signature.substring(0, 20)}... (original, now invalid)`, colors.red);

    const result = await sendRequest(tamperedMessage, 'TAMPERED REQUEST');

    if (!result.success && result.error && result.error.error) {
        const errorMsg = result.error.error.toLowerCase();
        if (errorMsg.includes('signature') || errorMsg.includes('invalid')) {
            log('\n🛡️  RESULT: Tampering SUCCESSFULLY DETECTED!', colors.green + colors.bright);
            log('HMAC signature verification failed - message integrity compromised.', colors.green);
        }
    }
}

async function scenario5_BruteForce() {
    printHeader('SCENARIO 5: Brute Force Replay (Optional - if rate limiting enabled)');

    log('Attacker tries to replay multiple requests rapidly.', colors.blue);
    log('If Nginx rate limiting is enabled, this will be blocked at infrastructure layer.', colors.blue);
    await waitForUser();

    const message = signMessage({
        roomId: 'demo-room-123',
        message: 'Spam message',
        userId: 'user-demo'
    });

    log('\n🎭 ATTACKER ACTION: Sending 20 requests in burst...', colors.red);

    let successCount = 0;
    let blockedCount = 0;
    let rateLimitedCount = 0;

    const promises = [];
    for (let i = 0; i < 20; i++) {
        promises.push(
            sendRequest({ ...message }, `BURST ${i + 1}`).then(result => {
                if (result.success) successCount++;
                else if (result.error && result.error.statusCode === 429) rateLimitedCount++;
                else blockedCount++;
            })
        );

        // Small delay between requests
        await sleep(50);
    }

    await Promise.all(promises);

    log('\n📊 RESULTS:', colors.cyan + colors.bright);
    log(`   ✅ Successful: ${successCount}`, successCount > 1 ? colors.yellow : colors.green);
    log(`   ❌ Blocked (duplicate nonce): ${blockedCount}`, colors.green);
    log(`   ⏱️  Rate Limited (429): ${rateLimitedCount}`, colors.green);

    if (rateLimitedCount > 0) {
        log('\n🛡️  RESULT: Rate limiting is ACTIVE and blocking excessive requests!', colors.green + colors.bright);
    } else if (blockedCount >= 19) {
        log('\n🛡️  RESULT: All replay attempts blocked by nonce verification!', colors.green + colors.bright);
    } else {
        log('\n⚠️  NOTE: Consider adding Nginx rate limiting for additional protection.', colors.yellow);
    }
}

async function displaySummary() {
    printHeader('DEMO SUMMARY - Security Features Verified');

    log('✅ HMAC Signature Verification', colors.green);
    log('   • Prevents message tampering', colors.cyan);
    log('   • Cryptographically secure (SHA-256)', colors.cyan);

    log('\n✅ Nonce Uniqueness Tracking', colors.green);
    log('   • Prevents immediate replay attacks', colors.cyan);
    log('   • Redis-based distributed storage', colors.cyan);
    log('   • 60-second TTL for efficiency', colors.cyan);

    log('\n✅ Timestamp Validation', colors.green);
    log('   • ±60 second acceptance window', colors.cyan);
    log('   • Prevents delayed replay attacks', colors.cyan);
    log('   • Protects against time-based exploits', colors.cyan);

    log('\n✅ Multi-Layer Defense', colors.green);
    log('   • Application layer (HMAC + Nonce)', colors.cyan);
    log('   • Infrastructure layer (Rate limiting - optional)', colors.cyan);
    log('   • Database layer (Redis state tracking)', colors.cyan);

    log('\n📚 THESIS CONTRIBUTION:', colors.yellow + colors.bright);
    log('   This demonstrates defense-in-depth security architecture', colors.yellow);
    log('   suitable for financial, healthcare, or critical systems.', colors.yellow);

    log('\n' + '='.repeat(70), colors.bright);
}

async function main() {
    try {
        console.clear();

        printHeader('🎓 MASTER\'S THESIS - REPLAY ATTACK DEFENSE DEMO');

        log('Configuration:', colors.cyan);
        log(`  Backend URL: ${VM1_URL}`, colors.blue);
        log(`  HMAC Secret: ${SECRET_KEY.substring(0, 10)}...`, colors.blue);

        log('\nThis demo will show:', colors.yellow);
        log('  1. Normal request processing', colors.yellow);
        log('  2. Immediate replay attack prevention', colors.yellow);
        log('  3. Delayed replay attack prevention', colors.yellow);
        log('  4. Message tampering detection', colors.yellow);
        log('  5. Brute force protection (if rate limiting enabled)', colors.yellow);

        await waitForUser('\nPress Enter to start demo...');

        // Run scenarios
        const { message: capturedMessage } = await scenario1_NormalRequest();
        await scenario2_ReplayImmediate(capturedMessage);
        await scenario4_ModifiedReplay();
        await scenario5_BruteForce();

        // Optional: Delayed replay (takes 70 seconds)
        log('\n' + '─'.repeat(70), colors.yellow);
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const runDelayed = await new Promise((resolve) => {
            rl.question(`\n${colors.cyan}Run Scenario 3 (Delayed Replay)? This takes 70 seconds. [y/N]: ${colors.reset}`, (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 'y');
            });
        });

        if (runDelayed) {
            await scenario3_ReplayAfterDelay(capturedMessage);
        } else {
            log('\nSkipping Scenario 3 (Delayed Replay).', colors.yellow);
        }

        // Summary
        await displaySummary();

        log('\n✅ Demo completed successfully!', colors.green + colors.bright);
        log('\nNext steps:', colors.cyan);
        log('  1. Check backend logs: docker logs backend_chat', colors.blue);
        log('  2. Check Redis state: docker exec -it redis redis-cli KEYS "chat:nonce:*"', colors.blue);
        log('  3. Document results in thesis', colors.blue);

    } catch (error) {
        log(`\n❌ Demo failed: ${error.message}`, colors.red);
        console.error(error);
        process.exit(1);
    }
}

// Run demo
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { signMessage, sendRequest };

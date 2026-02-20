#!/usr/bin/env node
/**
 * Generate HMAC Secret Key
 * 
 * Usage:
 *   node generate-hmac-key.js
 * 
 * Output will be a secure random key that you can add to your .env file
 */

const crypto = require('crypto');

// Generate 32 bytes (256 bits) random key
const secretKey = crypto.randomBytes(32).toString('hex');

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║          🔐 HMAC Secret Key Generated Successfully            ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Copy this line to your .env file:');
console.log('');
console.log('┌────────────────────────────────────────────────────────────────┐');
console.log(`│ HMAC_SECRET_KEY=${secretKey} │`);
console.log('└────────────────────────────────────────────────────────────────┘');
console.log('');
console.log('⚠️  IMPORTANT:');
console.log('  - Add this to .env on BOTH VM1 (apps) and VM2 (infrastructure)');
console.log('  - Keep this secret secure, never commit to git');
console.log('  - Use the same key across all services (backend + socket-bridge)');
console.log('');

// Also output as GitHub secret format
console.log('For GitHub Secrets:');
console.log(`  Name: HMAC_SECRET_KEY`);
console.log(`  Value: ${secretKey}`);
console.log('');

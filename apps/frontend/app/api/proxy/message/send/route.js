import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: '../../../.env' });
}

/**
 * Sort object to create canonical string
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
 * Add HMAC signature to request (server-side only, protect secret key)
 */
function addHMACSignature(payload) {
    const SECRET_KEY = process.env.HMAC_SECRET_KEY;
    if (!SECRET_KEY) {
        throw new Error('HMAC_SECRET_KEY not configured');
    }

    console.log('\n========================================');
    console.log('🔐 [FRONTEND] GENERATING HMAC SIGNATURE');
    console.log('========================================');
    console.log('[FRONTEND] Secret Key Source: ENV VAR');
    console.log('[FRONTEND] Secret Key (first 10 chars):', SECRET_KEY.substring(0, 10) + '...');

    const nonce = crypto.randomBytes(16).toString('hex');
    const eventTime = Math.floor(Date.now() / 1000);

    console.log('[FRONTEND] ✅ Generated Nonce (32 chars):', nonce);
    console.log('[FRONTEND] ✅ EventTime (Unix timestamp):', eventTime);

    const messageToSign = {
        ...payload,
        nonce,
        eventTime,
    };

    const sortedData = sortObject(messageToSign);
    const canonicalString = JSON.stringify(sortedData).replace(/\//g, '\\/');

    console.log('[FRONTEND] 📝 Canonical String (first 150 chars):', canonicalString.substring(0, 150) + '...');

    const signature = crypto.createHmac('sha256', SECRET_KEY)
        .update(canonicalString)
        .digest('hex');

    console.log('[FRONTEND] ✅ Generated Signature (64 chars):', signature);
    console.log('[FRONTEND] 📦 HMAC Package Ready:');
    console.log('           - Nonce:     ', nonce);
    console.log('           - Signature: ', signature);
    console.log('           - EventTime: ', eventTime);
    console.log('========================================\n');

    return {
        ...messageToSign,
        signature,
    };
}

/**
 * Gửi tin nhắn
 * POST /api/proxy/message/send
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        console.log('[MESSAGE-PROXY] 📥 Received from browser:', {
            roomId: body.roomId,
            content: body.content?.substring(0, 50),
            type: body.type,
        });

        if (!token) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // 🔍 DEBUG: Try to add HMAC (optional for now)
        let signedBody = body;
        try {
            if (process.env.HMAC_SECRET_KEY) {
                signedBody = addHMACSignature(body);
            } else {
                console.log('\n⚠️  [FRONTEND] HMAC_SECRET_KEY not configured');
                console.log('⚠️  [FRONTEND] Sending request WITHOUT HMAC protection\n');
            }
        } catch (hmacError) {
            console.error('\n❌ [FRONTEND] HMAC generation failed:', hmacError.message);
            console.log('⚠️  [FRONTEND] Continuing without HMAC...\n');
        }

        const backendUrl = process.env.BE_URL;
        const targetUrl = `${backendUrl}/api/v1/messages/send`;

        console.log('📤 [FRONTEND] Sending to Backend:', targetUrl);
        console.log('   Room ID:', body.roomId);
        console.log('   Content:', body.content?.substring(0, 50) + '...');
        console.log('   Has HMAC:', !!signedBody.signature);
        if (signedBody.signature) {
            console.log('   Nonce (first 16):', signedBody.nonce.substring(0, 16) + '...');
            console.log('   Signature (first 16):', signedBody.signature.substring(0, 16) + '...');
        }

        const backendResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,
            },
            body: JSON.stringify(signedBody),
        });

        const data = await backendResponse.json();

        if (backendResponse.status === 201 && signedBody.signature) {
            console.log('\n✅ [FRONTEND] Message sent successfully with HMAC protection');
            console.log('✅ [FRONTEND] Backend verified signature and stored nonce in Redis');
            console.log('========================================\n');
        } else if (backendResponse.status === 201) {
            console.log('\n✅ [FRONTEND] Message sent (without HMAC)\n');
        }

        console.log('[MESSAGE-PROXY] 📨 Backend response:', {
            status: backendResponse.status,
            success: data.success,
        });

        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('[MESSAGE-PROXY] ❌ Error in message proxy:', error);
        console.error('[MESSAGE-PROXY] Error stack:', error.stack);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

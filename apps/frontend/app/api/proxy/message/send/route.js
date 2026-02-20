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

    console.log('[FRONTEND-PROXY] Adding HMAC to request');
    console.log('[FRONTEND-PROXY] Nonce:', nonce.substring(0, 16) + '...');
    console.log('[FRONTEND-PROXY] Signature:', signature.substring(0, 20) + '...');

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
                console.log('[MESSAGE-PROXY] 🔐 HMAC_SECRET_KEY found, adding signature...');
                signedBody = addHMACSignature(body);
                console.log('[MESSAGE-PROXY] ✅ HMAC added successfully');
            } else {
                console.log('[MESSAGE-PROXY] ⚠️  HMAC_SECRET_KEY not configured, sending without HMAC');
            }
        } catch (hmacError) {
            console.error('[MESSAGE-PROXY] ⚠️  HMAC generation failed:', hmacError.message);
            console.log('[MESSAGE-PROXY] Continuing without HMAC...');
        }

        const backendUrl = process.env.BE_URL;
        const targetUrl = `${backendUrl}/api/v1/messages/send`;

        console.log('[MESSAGE-PROXY] 📤 Sending to backend:', {
            BE_URL: backendUrl,
            targetUrl: targetUrl,
            hasSignature: !!signedBody.signature,
            hasNonce: !!signedBody.nonce,
        });

        const backendResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,
            },
            body: JSON.stringify(signedBody),
        });

        const data = await backendResponse.json();

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

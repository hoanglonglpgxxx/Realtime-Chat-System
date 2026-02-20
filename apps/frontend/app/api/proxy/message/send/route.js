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

        if (!token) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Add HMAC signature (server-side, secret key protected)
        const signedBody = addHMACSignature(body);

        const backendUrl = process.env.BE_URL;
        const targetUrl = `${backendUrl}/api/v1/messages/send`;

        console.log('[MESSAGE-PROXY] Message Send Proxy:', {
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

        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('Error in message proxy:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

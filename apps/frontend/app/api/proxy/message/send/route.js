import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: '../../../.env' });
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

        const backendResponse = await fetch(`${process.env.BE_URL}/api/v1/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,
            },
            body: JSON.stringify(body),
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

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: '../../../.env' });
}

/**
 * Lấy tin nhắn trong room
 * GET /api/proxy/messages/:roomId
 */
export async function GET(request, { params }) {
    try {
        const { roomId } = await params;
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get query params
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') || '50';
        const before = searchParams.get('before') || '';

        const url = `${process.env.BE_URL}/api/v1/messages/${roomId}?limit=${limit}${before ? `&before=${before}` : ''}`;

        const backendResponse = await fetch(url, {
            method: 'GET',
            headers: {
                'x-access-token': token,
            },
        });

        const data = await backendResponse.json();

        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

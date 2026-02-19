import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: '../../../.env' });
}

/**
 * Lấy danh sách rooms của user
 * GET /api/proxy/rooms/my-rooms
 */
export async function GET(request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const backendResponse = await fetch(`${process.env.BE_URL}/api/v1/rooms/my-rooms`, {
            method: 'GET',
            headers: {
                'x-access-token': token,
            },
        });

        const data = await backendResponse.json();

        return NextResponse.json(data, { status: backendResponse.status });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

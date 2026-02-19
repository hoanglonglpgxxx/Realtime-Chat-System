import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: '../../../.env' });
}

/**
 * Tìm hoặc tạo room 1-1
 * POST /api/proxy/rooms/find-or-create
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const cookieStore = cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const backendResponse = await fetch(`${process.env.BE_URL}/api/v1/rooms/find-or-create`, {
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
        console.error('Error in room proxy:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

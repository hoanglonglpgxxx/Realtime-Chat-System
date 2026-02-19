import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * GET /api/proxy/users - Lấy danh sách users (contacts)
 */
export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Forward to backend
        const backendResponse = await fetch(`${process.env.BE_URL}/api/v1/users`, {
            method: 'GET',
            headers: {
                'x-access-token': token,
                'Content-Type': 'application/json',
            },
        });

        const data = await backendResponse.json();

        if (!backendResponse.ok) {
            return NextResponse.json(data, { status: backendResponse.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Proxy users error:', error);
        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}

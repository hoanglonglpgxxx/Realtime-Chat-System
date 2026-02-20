import { NextResponse } from 'next/server';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: '../../.env' });
}

export async function POST(request) {
    try {
        const body = await request.json();

        // 1. Gọi đến Express Backend
        const backendResponse = await fetch(`${process.env.BE_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await backendResponse.json();
        console.log('Backend login response:', { ...data, accessToken: data.accessToken ? '***' : undefined });

        if (!backendResponse.ok) {
            return NextResponse.json(data, { status: backendResponse.status });
        }

        // 2. Tạo phản hồi của Next.js
        const response = NextResponse.json(
            { message: "Đăng nhập thành công", user: data },
            { status: 200 }
        );

        // 3. Cài đặt HttpOnly Cookie
        response.cookies.set({
            name: 'token',
            value: data.accessToken,
            httpOnly: true, // Chặn JavaScript truy cập (Chống XSS)
            secure: false, // Tạm thời set false cho development
            sameSite: 'lax', // Đổi từ strict sang lax để cookie được gửi sau redirect
            maxAge: 60 * 60 * 24, // Hết hạn sau 24h (khớp với JWT)
            path: '/', // Có hiệu lực cho toàn bộ website
        });

        console.log('[LOGIN-PROXY] Cookie set:', { name: 'token', hasValue: !!data.accessToken });

        return response;
    } catch (error) {
        console.error("========================================");
        console.error("LỖI GỌI API BACKEND:");
        console.error("URL:", `${process.env.BE_URL}/api/...`);
        console.error("Chi tiết lỗi:", error.message);
        if (error.cause) console.error("Nguyên nhân sâu xa:", error.cause);
        console.error("========================================");
        return NextResponse.json({ message: "Lỗi Proxy" }, { status: 500 });
    }
}
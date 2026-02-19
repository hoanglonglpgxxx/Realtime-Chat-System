import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // Tạo response
        const response = NextResponse.json(
            { message: "Đăng xuất thành công" },
            { status: 200 }
        );

        // Xóa HttpOnly Cookie bằng cách set maxAge = 0
        response.cookies.set({
            name: 'token',
            value: '',
            httpOnly: true,
            secure: false, // Đồng nhất với login
            sameSite: 'lax', // Đồng nhất với login
            maxAge: 0, // Xóa cookie ngay lập tức
            path: '/',
        });

        return response;
    } catch (error) {
        console.error("Lỗi khi đăng xuất:", error);
        return NextResponse.json(
            { message: "Lỗi khi đăng xuất" },
            { status: 500 }
        );
    }
}

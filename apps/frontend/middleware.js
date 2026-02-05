import { NextResponse } from 'next/server';

export function middleware(request) {
    // 1. Lấy token từ cookie
    const token = request.cookies.get('token')?.value;
    const isChatPage = request.nextUrl.pathname.startsWith('/chat');
    const isDashboard = request.nextUrl.pathname.startsWith('/dasboard');

    // 2. Nếu vào trang Chat mà không có Token -> Đá về Login
    if ((isChatPage || isDashboard) && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. Nếu đã có Token mà vẫn cố vào Login -> Đẩy thẳng vào Chat
    if (request.nextUrl.pathname === '/login' && token) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

// Chỉ chạy middleware cho các đường dẫn này
export const config = {
    matcher: ['/chat/:path*', '/login'],
};
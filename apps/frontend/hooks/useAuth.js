"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Custom hook để quản lý authentication state
 * Lưu ý: Token được lưu trong HttpOnly cookie, không thể truy cập từ JavaScript
 * Hook này chỉ quản lý user profile từ localStorage
 */
export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Lấy user profile từ localStorage
        const loadUser = () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    return JSON.parse(storedUser);
                } catch (error) {
                    console.error('Error parsing user data:', error);
                    localStorage.removeItem('user');
                    return null;
                }
            }
            return null;
        };

        const userData = loadUser();
        setUser(userData);
        setLoading(false);
    }, []);

    const logout = async () => {
        try {
            // Gọi API logout để xóa HttpOnly cookie
            await fetch('/api/proxy/logout', { method: 'POST' });

            // Xóa user profile từ localStorage
            localStorage.removeItem('user');
            setUser(null);

            // Redirect về login
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateUser = (userData) => {
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    return {
        user,
        loading,
        isAuthenticated: !!user,
        logout,
        updateUser
    };
}

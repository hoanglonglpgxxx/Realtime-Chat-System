// apps/frontend/services/auth.service.js
const PROXY_URL = "/api/proxy/";

export const login = async (username, password) => {
    const response = await fetch(PROXY_URL + "login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
        // CHỈ lưu thông tin user profile (KHÔNG lưu token: token nằm trong HttpOnly Cookie)
        if (data.user) {
            const userProfile = {
                id: data.user.id,
                username: data.user.username,
                email: data.user.email,
                fullName: data.user.fullName,
                avatar: data.user.avatar,
                roles: data.user.roles
            };
            localStorage.setItem("user", JSON.stringify(userProfile));
        }
    } else {
        // Ném lỗi để React Query hoặc Catch block ở Form xử lý
        throw new Error(data.message || "Đăng nhập thất bại");
    }

    return data;
};

export const logout = async () => {
    // Gọi API Proxy để xóa Cookie ở Server
    await fetch(PROXY_URL + "logout", { method: "POST" });
    localStorage.removeItem("user");
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error("Error parsing user data:", e);
            return null;
        }
    }
    return null;
};
// apps/frontend/app/services/auth.service.js
const PROXY_URL = "/api/proxy/";

export const login = async (username, password) => {
    const response = await fetch(PROXY_URL + "login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
        // CHỈ lưu thông tin profile (tên, avatar), KHÔNG lưu token
        // Vì token giờ đã nằm an toàn trong HttpOnly Cookie
        if (data.user) {
            localStorage.setItem("user_profile", JSON.stringify(data.user));
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
    localStorage.removeItem("user_profile");
};
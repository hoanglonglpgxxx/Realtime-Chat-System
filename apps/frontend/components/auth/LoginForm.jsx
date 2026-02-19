"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Dùng để chuyển hướng sau khi login
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function LoginForm() {
  // Đổi email thành username để khớp với logic Backend của bạn
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Gọi đến API Route của Next.js (Proxy) thay vì Express trực tiếp
      const response = await fetch("/api/proxy/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log("Login result:", result);

      if (response.ok) {
        // 2. CHỈ lưu thông tin User (KHÔNG lưu token vì đã ở HttpOnly Cookie)
        if (result.user) {
          const userData = {
            id: result.user.id,
            username: result.user.username,
            email: result.user.email,
            fullName: result.user.fullName,
            avatar: result.user.avatar,
            roles: result.user.roles,
          };
          console.log("Saving user to localStorage:", userData);
          localStorage.setItem("user", JSON.stringify(userData));
        }
        toast.success(result.message || "Đăng nhập thành công!");

        // 3. Chuyển hướng - dùng window.location để force reload và trigger middleware
        console.log("Redirecting to dashboard...");
        window.location.href = "/dashboard";
      } else {
        // Hiển thị lỗi từ Backend trả về thông qua Proxy
        toast.error(result.message || "Đăng nhập thất bại!");
      }
    } catch (err) {
      toast.error("Không thể kết nối tới hệ thống Proxy!");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 w-full max-w-3xl p-20 bg-white rounded-xl shadow-lg border border-gray-100"
    >
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Đăng nhập hệ thống</h1>
      </div>

      <Input
        label="Tên đăng nhập"
        name="username"
        type="text"
        placeholder="Nhập username của bạn"
        value={formData.username}
        onChange={handleChange}
        required
      />

      <Input
        label="Mật khẩu"
        name="password"
        type="password"
        placeholder="••••••••"
        value={formData.password}
        onChange={handleChange}
        required
      />

      <Button type="submit" isLoading={loading}>
        Vào phòng Chat
      </Button>
    </form>
  );
}

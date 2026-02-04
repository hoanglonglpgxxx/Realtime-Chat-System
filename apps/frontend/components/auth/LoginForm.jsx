"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Giả lập gọi API login
    console.log("Đang đăng nhập với:", formData);

    setTimeout(() => {
      setLoading(false);
      alert("Đăng nhập thành công! (Đây là demo)");
    }, 1500);
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
        <h1 className="text-2xl font-bold text-gray-800">Đăng nhập</h1>
      </div>

      <Input
        label="Email"
        name="email"
        type="email"
        placeholder="name@company.com"
        value={formData.email}
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

      {/* <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="rounded border-gray-300" />
          <span className="text-gray-600">Ghi nhớ</span>
        </label>
        <a href="#" className="text-blue-600 hover:underline">
          Quên mật khẩu?
        </a>
      </div> */}

      <Button type="submit" isLoading={loading}>
        Đăng nhập
      </Button>

      {/* <p className="text-center text-sm text-gray-600 mt-2">
        Chưa có tài khoản?{" "}
        <a href="/register" className="text-blue-600 font-medium hover:underline">
          Đăng ký ngay
        </a>
      </p> */}
    </form>
  );
}

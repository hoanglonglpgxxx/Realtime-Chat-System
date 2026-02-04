"use client";

export default function Button({ children, variant = "primary", isLoading, ...props }) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      disabled={isLoading}
      className={`px-4 py-2 rounded-md font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
      `}
      {...props}
    >
      {isLoading ? "Đang xử lý..." : children}
    </button>
  );
}

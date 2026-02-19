"use client";

import { useAuth } from "@/hooks/useAuth";

function UserInfo() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow animate-pulse">
        <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-300 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">Bạn chưa đăng nhập</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <img
        src={
          user.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`
        }
        alt={user.username}
        className="w-14 h-14 rounded-full border-2 border-blue-500 object-cover"
      />
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 text-lg">
          {user.fullName || user.username}
        </h3>
        <p className="text-gray-600 text-sm">{user.email}</p>
        {user.roles && user.roles.length > 0 && (
          <div className="flex gap-1 mt-1">
            {user.roles.map((role, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
              >
                {role.replace("ROLE_", "")}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={logout}
        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Đăng xuất
      </button>
    </div>
  );
}

export default UserInfo;

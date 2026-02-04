"use client";

export default function Input({ label, error, ...props }) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={`px-3 py-2 bg-white border rounded-md outline-none transition-all
          focus:ring-2 focus:ring-blue-500/20
          ${error ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}
        `}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

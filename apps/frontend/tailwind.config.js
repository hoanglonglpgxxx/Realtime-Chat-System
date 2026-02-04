/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx}",        // Sửa lại cho đúng cấu trúc không có src
        "./components/**/*.{js,jsx}", // Quét thư mục components ở root frontend
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
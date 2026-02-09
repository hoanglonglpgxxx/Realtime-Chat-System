FROM node:22-alpine

# Tạo thư mục làm việc
WORKDIR /app

# Copy file quản lý thư viện
COPY package*.json ./

# Cài đặt thư viện
RUN npm install --production

# Copy toàn bộ mã nguồn backend
COPY . .

# Mở cổng mà ứng dụng Node.js
EXPOSE 5000

# Lệnh khởi chạy
CMD ["npm", "start"]
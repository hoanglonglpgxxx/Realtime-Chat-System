FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
# Chạy ở cổng 5000 (nội bộ VM2)
EXPOSE 5000
CMD ["npm", "start"]
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build ứng dụng frontend
RUN npm run build

EXPOSE 3000

# Chạy frontend
CMD ["npm", "start"]
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build arguments for Next.js
ARG SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_URL=$SOCKET_URL

# Clear Next.js cache and build fresh
RUN rm -rf .next
RUN npm run build

EXPOSE 3000

# Chạy frontend
CMD ["npm", "start"]
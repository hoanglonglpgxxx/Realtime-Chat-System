# Real-time Chat System: Defense-in-Depth Architecture

Hệ thống truyền tin thời gian thực được thiết kế theo mô hình phòng thủ nhiều lớp (Defense in Depth), tập trung vào khả năng mở rộng (Scalability) và bảo mật kênh truyền nâng cao.

## Kiến trúc Hệ thống

Dự án triển khai theo mô hình Distributed Monorepo nhằm tối ưu hóa việc quản lý và triển khai.

Frontend: React (Vite) - Giao diện người dùng hiện đại, tối ưu hóa hiệu năng render.

Backend: Node.js (Express) - Xử lý logic nghiệp vụ và điều phối kết nối.

Message Broker: Redis - Đảm bảo đồng bộ hóa tin nhắn giữa các instance trong cụm Load Balancer.

Database: MongoDB - Lưu trữ dữ liệu người dùng và lịch sử hội thoại.

Reverse Proxy & Load Balancer: Nginx - Xử lý SSL Termination, điều phối lưu lượng và bảo vệ biên.

## Tính năng Bảo mật Trọng tâm

Đây là các thành phần cốt lõi nhằm đáp ứng yêu cầu của 8 Domain CISSP trong bài thi.

1. Cơ chế Chống tấn công Phát lại (Anti-replay Mechanism)
   Hệ thống sử dụng kết hợp HMAC và Timestamp để bảo vệ giao thức Socket.io.

HMAC Verification: Mọi gói tin gửi đi đều được ký.

Time-window Validation: Server chỉ chấp nhận các gói tin có timestamp trong vòng 5 giây so với thời gian thực tế để loại bỏ các yêu cầu bị phát lại.

2. Bảo mật Kênh truyền (Communication Security)
   SSL/TLS Termination: Triển khai mã hóa toàn bộ dữ liệu từ Client đến Nginx qua HTTPS và WSS.

Sticky Sessions: Cấu hình Nginx với ip_hash để đảm bảo tính nhất quán của kết nối WebSocket trong môi trường đa Server.

3. Quản lý Định danh & Truy cập (IAM)
   Stateless Auth: Sử dụng JWT (JSON Web Token) để quản lý phiên làm việc của người dùng.

Redis Security: Cấu hình xác thực mật khẩu và giới hạn quyền truy cập Network cho Redis.

## Công nghệ Sử dụng

| Thành phần     | Công nghệ         | Vai trò                        |
| -------------- | ----------------- | ------------------------------ |
| Frontend       | React+ Vite       | UI/UX & Client Logic           |
| Backend        | Node.js + Express | API & Socket Server            |
| Real-time      | Socket.io         | Giao tiếp                      |
| Broker         | Redis             | Message Scaling & Adapter      |
| Database       | MongoDB           |                                |
| Infrastructure | Nginx             | Load Balancer & Security Proxy |

## Hướng dẫn Cài đặt nhanh

Clone dự án:

git clone https://github.com/your-repo/chat-system.git
cd chat-system

Cài đặt Workspaces:

npm install

Khởi chạy chế độ Phát triển (Dev):

Chạy đồng thời FE và BE
npm run dev:all

## Ánh xạ Domain CISSP

| Domain CISSP                            | Thành phần triển khai trong dự án                           |
| --------------------------------------- | ----------------------------------------------------------- |
| Domain 3: Security Engineering          | Thiết kế kiến trúc phòng thủ chiều sâu (Defense in Depth).  |
| Domain 4: Network Security              | Bảo mật giao thức WebSocket và cấu hình Load Balancer.      |
| Domain 5: IAM                           | Hệ thống quản lý phiên JWT và cơ chế xác thực Socket.       |
| Domain 8: Software Development Security | Xử lý chống Injection và Anti-replay trực tiếp từ mã nguồn. |

## Minh chứng 5W1H

Who: Quản trị viên hệ thống và người dùng cần giao tiếp an toàn.

What: Bảo vệ tính toàn vẹn (Integrity) và tính sẵn sàng (Availability) của tin nhắn.

When: Thực thi kiểm tra bảo mật tại mọi thời điểm diễn ra kết nối.

Where: Triển khai trên môi trường Cloud/On-premise qua Proxy Nginx.

Why: Chống lại các cuộc tấn công Replay và Man-in-the-Middle (MitM).

How: Kết hợp HMAC, Timestamp, JWT và kiến trúc phòng thủ đa lớp.

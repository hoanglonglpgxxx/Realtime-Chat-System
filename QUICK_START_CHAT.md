# 🚀 Quick Start: Test Chat Ngay

## Bước 1: Seed Users (30 giây)

```bash
cd apps/backend
node test/seed-users.js
```

✅ Tạo 4 users: alice, bob, charlie, diana (password: 123456)

---

## Bước 2: Start Services (1 phút)

```bash
# Terminal 1: Infrastructure
cd infrastructure
docker-compose up -d

# Terminal 2: Apps
cd apps
docker-compose up -d
```

Verify:

```bash
docker ps  # Should see 6 containers running
```

---

## Bước 3: Test Chat (2 phút)

### Browser Window 1:

1. Vào `http://localhost:8029/login`
2. Login: `alice` / `123456`
3. Vào `/chat`
4. Click chọn user "Bob"
5. Gửi tin: "Hello Bob! 👋"

### Browser Window 2 (Incognito):

1. Vào `http://localhost:8029/login`
2. Login: `bob` / `123456`
3. Vào `/chat`
4. Click chọn user "Alice"
5. **Tin nhắn của Alice xuất hiện ngay!** ✨

---

## ✅ Checklist

- [ ] Socket status: "Connected to server" (màu xanh)
- [ ] Tin nhắn xuất hiện ngay lập tức
- [ ] Avatar và username hiển thị đúng
- [ ] Refresh vẫn còn messages (đã lưu DB)

---

## 🐛 Debug Nhanh

**Socket không kết nối:**

```bash
docker logs socket-bridge
# Should see: "Socket Server listening on port 3000"
```

**Không nhận tin nhắn:**

```bash
docker logs backend_chat
# Should see: "Published to Redis: ..."
```

**Check DB:**

```bash
mongosh -u admin -p mitsne --authenticationDatabase admin
use realtime-chat
db.messages.find().pretty()
```

---

## 📖 Chi Tiết

Xem [CHAT_TESTING_GUIDE.md](./CHAT_TESTING_GUIDE.md) để biết thêm chi tiết.

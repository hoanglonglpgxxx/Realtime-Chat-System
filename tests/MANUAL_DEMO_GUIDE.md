# Manual Demo Guide - Defense-in-Depth Security Testing

**Dành cho: Demo trước hội đồng / Ghi hình cho thesis**

---

## 🎯 Tổng Quan 3 Attack Scenarios

### Scenario 3A: **Replay Attack** (Bắt & Phát Lại Gói Tin)

- Attacker bắt gói tin hợp lệ
- Replay lại sau đó
- System chặn bằng nonce tracking

### Scenario 3B: **Message Tampering** (Sửa Nội Dung)

- Attacker sửa content trong message
- HMAC signature không match
- System reject ngay lập tức

### Scenario 3C: **Forged Signature** (Giả Mạo Chữ Ký)

- Attacker tạo message với fake HMAC
- System verify HMAC → FAIL
- Request bị deny

---

## 🔥 SCENARIO 3A: REPLAY ATTACK (Real Packet Capture)

### **Công Cụ Cần Có:**

- ✅ Browser DevTools (Network tab)
- ✅ Burp Suite (hoặc Postman)
- ✅ Terminal với curl

### **Bước 1: Gửi Message Thật Từ Browser**

1. Mở browser, truy cập chat: `http://35.193.42.199:8029/chat`
2. Mở DevTools (F12) → Tab **Network**
3. Filter: **Fetch/XHR**
4. Gửi message: "Hello Defense-in-Depth"
5. Tìm request: `POST /api/proxy/message/send`

### **Bước 2: Capture Request Data**

**Click vào request → Tab "Payload":**

```json
{
  "roomId": "65f1234567890abcdef",
  "content": "Hello Defense-in-Depth",
  "nonce": "1a2b3c4d5e6f7890abcdef...",
  "timestamp": 1708444800000,
  "hmac": "9f8e7d6c5b4a3210fedcba..."
}
```

**Copy Headers:**

```
Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### **Bước 3: Replay Attack - Gửi Lại Request**

**Mở terminal, paste command:**

```bash
curl -X POST http://35.193.42.199:8029/api/proxy/message/send \
  -H "Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "65f1234567890abcdef",
    "content": "Hello Defense-in-Depth",
    "nonce": "1a2b3c4d5e6f7890abcdef...",
    "timestamp": 1708444800000,
    "hmac": "9f8e7d6c5b4a3210fedcba..."
  }'
```

### **Bước 4: Kết Quả Mong Đợi**

**First request (from browser):**

```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

**Replay attack (from curl):**

```json
{
  "success": false,
  "error": "Nonce already used - Replay attack detected!"
}
```

**HTTP Status: 401 Unauthorized**

### **Bước 5: Verify Redis Nonce**

```bash
# SSH to VM2
gcloud compute ssh tracker-n-chat-infrastructure --zone=us-central1-c

# Check nonce in Redis
docker exec -it redis redis-cli -a YOUR_PASSWORD
KEYS chat:nonce:*
GET chat:nonce:1a2b3c4d5e6f7890abcdef...
TTL chat:nonce:1a2b3c4d5e6f7890abcdef...

# Output:
# "1"
# 45  (seconds remaining until expiry)
```

**📸 Screenshots Cần Chụp:**

1. ✅ Browser Network tab (request thành công)
2. ✅ Terminal curl (replay bị chặn, 401)
3. ✅ Redis CLI (nonce được lưu với TTL)
4. ✅ Backend logs (error message)

---

## 🛠️ SCENARIO 3B: MESSAGE TAMPERING

### **Attack:** Sửa content nhưng giữ nguyên HMAC

**Bước 1: Copy request hợp lệ từ DevTools**

```json
{
  "roomId": "65f1234567890abcdef",
  "content": "Hello",
  "nonce": "abc123...",
  "timestamp": 1708444800000,
  "hmac": "9f8e7d..." // HMAC cho "Hello"
}
```

**Bước 2: TAMPER - Sửa content**

```bash
curl -X POST http://35.193.42.199:8029/api/proxy/message/send \
  -H "Cookie: token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "65f1234567890abcdef",
    "content": "HACKED MESSAGE",
    "nonce": "abc123...",
    "timestamp": 1708444800000,
    "hmac": "9f8e7d..."
  }'
```

**Kết Quả:**

```json
{
  "success": false,
  "error": "Invalid HMAC signature - Message tampered!"
}
```

**HTTP Status: 401 Unauthorized**

**Giải Thích:**

- HMAC được tính từ: `roomId + content + nonce + timestamp`
- Nếu sửa `content` → HMAC không match
- System reject ngay

**📸 Screenshots:**

1. Original request với content "Hello"
2. Tampered request với content "HACKED"
3. Error response: Invalid HMAC

---

## 🔓 SCENARIO 3C: FORGED SIGNATURE

### **Attack:** Tạo message hoàn toàn mới với fake HMAC

```bash
curl -X POST http://35.193.42.199:8029/api/proxy/message/send \
  -H "Cookie: token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "65f1234567890abcdef",
    "content": "Fake message",
    "nonce": "fake-nonce-12345",
    "timestamp": 1708444800000,
    "hmac": "00000000000000000000000000000000"
  }'
```

**Kết Quả:**

```json
{
  "success": false,
  "error": "Invalid HMAC signature"
}
```

**Giải Thích:**

- Attacker không biết `HMAC_SECRET_KEY`
- Không thể tạo valid signature
- System reject

---

## 📊 Demo Flow Cho Hội Đồng

### **Timeline: 10 phút**

**[0:00 - 2:00] Setup & Giới Thiệu**

- Mở browser, đăng nhập vào chat
- Mở DevTools Network tab
- Giải thích sẽ demo 3 loại attack

**[2:00 - 4:00] Scenario 3A: Replay Attack**

1. Gửi message từ browser → thành công
2. Copy request data từ DevTools
3. Paste vào curl → replay
4. Show error: "Nonce already used"
5. SSH VM2, show Redis nonce tracking

**[4:00 - 6:00] Scenario 3B: Message Tampering**

1. Copy request hợp lệ
2. Sửa content trong curl command
3. Send → show error: "Invalid HMAC"
4. Giải thích: HMAC bảo vệ integrity

**[6:00 - 8:00] Scenario 3C: Forged Signature**

1. Tạo fake request với random HMAC
2. Send → show error
3. Giải thích: Secret key protection

**[8:00 - 10:00] Defense-in-Depth Summary**

- Show diagram: 3 layers
- Nếu bypass network → HMAC chặn
- Nếu có HMAC → Nonce chặn replay
- Multi-layer protection

---

## 🎬 Recording Checklist

### **Before Recording:**

- [ ] VMs đang chạy
- [ ] Browser đã login vào chat
- [ ] DevTools đã mở Network tab
- [ ] Terminal sẵn sàng
- [ ] Redis CLI test đã chạy thử
- [ ] Screen resolution: 1920x1080
- [ ] Font size đủ lớn để đọc

### **During Recording:**

- [ ] Nói rõ từng bước đang làm gì
- [ ] Pause sau mỗi command để show output
- [ ] Highlight error messages bằng mouse
- [ ] Zoom vào quan trọng parts

### **Slides Should Show:**

- [ ] Architecture diagram (2 VMs)
- [ ] HMAC calculation formula
- [ ] Nonce tracking flow
- [ ] Attack scenario diagrams
- [ ] Results summary table

---

## 🔍 Troubleshooting

### **Problem: Cookie expired**

```bash
# Re-login browser, get new token
# Copy from DevTools → Application → Cookies
```

### **Problem: Nonce đã hết hạn trong Redis**

```bash
# Wait 60 seconds, try replay again
# Or use a fresh request
```

### **Problem: HMAC không match do formatting**

```bash
# Make sure JSON không có extra spaces
# Content-Type must be application/json
```

---

## 📝 Notes Cho Thesis

**Viết vào thesis:**

> "Để chứng minh tính hiệu quả của hệ thống phòng thủ, chúng tôi thực hiện penetration testing với các kịch bản tấn công thực tế. Thay vì sử dụng automated test scripts, chúng tôi bắt các gói tin HTTP thực từ browser và thực hiện replay attack thủ công, mô phỏng chính xác hành vi của attacker."

**Evidence cần có:**

1. Screenshots của successful request (200 OK)
2. Screenshots của replay attack (401 Unauthorized)
3. Redis CLI output showing nonce tracking
4. Backend logs showing detection
5. Video recording của toàn bộ demo (optional)

---

**📅 Last Updated:** February 20, 2026  
**🎓 For:** Master's Thesis - Defense-in-Depth Security Architecture

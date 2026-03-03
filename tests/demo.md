# DEMO STEP

## 🎯 DEMO 1: Gửi tin nhắn bình thường (1 phút)

### **Step 1: Gửi message từ browser**

1. Gõ message: **"Demo for thesis"**
2. Click **Send**
3. ✅ Message hiển thị → Thành công!

### **Step 2: Capture request trong DevTools**

5. Tab **Headers** → Request Headers
6. Copy: `Cookie: token=eyJhbGci...`

## � DEMO 1.5: Xem Logs chi tiết Nonce & Signature (1 phút)

### **Step 2.5: Check Frontend Proxy Logs**

Xem logs khi frontend proxy **generate HMAC**:

```bash
# SSH vào VM1
docker logs frontend_chat --tail 20

# Tìm đoạn:
# [FRONTEND-PROXY] Adding HMAC to request
# [FRONTEND-PROXY] Nonce (full): a7f3e9c1b2d4f5e6c8a9b0d1e2f34567
# [FRONTEND-PROXY] Signature (full): 9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c...
```

### **Step 2.6: Check Backend Logs**

Xem logs khi backend **verify HMAC**:

```bash
# SSH vào VM1
docker logs backend_chat --tail 30

# Tìm đoạn:
# [MESSAGE-SEND] 📥 Received request:
#   - signature (full): 9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c...
#   - nonce (full): a7f3e9c1b2d4f5e6c8a9b0d1e2f34567
#   - eventTime: 1772518757
# [MESSAGE-SEND] 🔐 HMAC fields present, verifying...
# [HMAC-VERIFY] Expected signature (full): 9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c...
# [HMAC-VERIFY] Received signature (full): 9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c...
# [MESSAGE-SEND] ✅ HMAC verified, nonce stored
```

### **Giải thích cho slide:**

> "Logs cho thấy quá trình end-to-end: Frontend tạo nonce và HMAC signature, Backend nhận và verify thành công, sau đó lưu nonce vào Redis để chặn replay attack."

### **📸 Screenshot 1.5:** Terminal showing both frontend and backend logs with matching nonce/signature

---

## �🔴 DEMO 2: Replay Attack (2 phút)

### **Step 3: Tạo curl command**

Paste vào terminal SSH VM1:

```bash
curl -X POST 'http://35.193.42.199:8029/api/proxy/message/send' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: COOKIE' \
  --data '{
    "roomId": "ROOM_ID",
    "content": "Demo replay attack",
    "type": "text",
    "nonce": "NONCE_VAL",
    "eventTime": EVENT_TIME,
    "signature": "SIGNATURE"
  }'
```

### **Kết quả mong đợi:**

❌ **BLOCKED:**

```json
{
  "message": "Unauthorized!",
  "error": "Nonce already used (replay attack detected)"
}
```

### **Giải thích:**

- Request đầu tiên → Backend lưu `nonce` vào Redis (TTL 60s)
- Request thứ 2 (replay) → Backend check nonce đã tồn tại → **Chặn!**

### **Step 3.5: Check Backend Logs - Replay Detected**

```bash
docker logs backend_chat --tail 20

# Tìm đoạn:
# [MESSAGE-SEND] 🔐 HMAC fields present, verifying...
# [HMAC-VERIFY] Received signature (full): 9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c...
# [HMAC-VERIFY] Nonce (full): a7f3e9c1b2d4f5e6c8a9b0d1e2f34567
# [MESSAGE-SEND] ❌ HMAC verification failed: Nonce already used (replay attack detected)
```

### **📸 Screenshot 2:** Terminal showing 401 Unauthorized + error message + backend logs

---

## 🛡️ DEMO 3: Message Tampering (1 phút)

### **Step 4: Thử sửa nội dung giữ nguyên HMAC**

Chạy curl với **content khác** nhưng **HMAC giữ nguyên**:

```bash
curl -X POST 'http://35.193.42.199:8029/api/proxy/message/send' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: token=eyJhbGci...[SAME_TOKEN]' \
  --data '{
    "roomId": "699748dea8449ea60d32c4f6",
    "content": "HACKED MESSAGE <script>alert(1)</script>",
    "type": "text",
    "nonce": "NEW_NONCE_12345678901234567890abcd",
    "eventTime": '$(date +%s)',
    "signature": "9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c..."
  }'
```

### **Kết quả mong đợi:**

❌ **BLOCKED:**

```json
{
  "message": "Unauthorized!",
  "error": "Invalid HMAC signature"
}
```

### **Giải thích:**

- HMAC được tính từ: `roomId + content + nonce + eventTime`
- Content thay đổi → HMAC không match → **Chặn!**

### **Step 4.5: Check Backend Logs - Signature Mismatch**

```bash
docker logs backend_chat --tail 20

# Tìm đoạn:
# [MESSAGE-SEND] 🔐 HMAC fields present, verifying...
# [HMAC-VERIFY] Expected signature (full): abc123def456... (calculated from new content)
# [HMAC-VERIFY] Received signature (full): 9f8e7d6c5b4a3f2e... (old signature)
# [MESSAGE-SEND] ❌ HMAC verification failed: Invalid HMAC signature
```

### **Giải thích chi tiết:**

> "Backend tính toán lại HMAC signature dựa trên nội dung nhận được. Vì attacker đã sửa content nhưng giữ nguyên signature cũ, hai giá trị này không khớp → request bị chặn."

### **📸 Screenshot 3:** Terminal showing HMAC verification failed + logs comparing signatures

---

## 🔍 DEMO 4: Verify Nonce trong Redis (30 giây)

### **Step 5: Check Redis**

```bash
# SSH vào VM2 (hoặc từ VM1 if Redis is accessible)
docker exec -it redis redis-cli -a your_password

# Xem tất cả nonce đã lưu
KEYS chat:nonce:*

# Output:
# 1) "chat:nonce:a7f3e9c1b2d4f5e6c8a9b0d1e2f34567"

# Check TTL (Time To Live)
TTL chat:nonce:a7f3e9c1b2d4f5e6c8a9b0d1e2f34567

# Output: 58 (seconds remaining, max 60)
```

### **📸 Screenshot 4:** Redis CLI showing nonce with TTL

---

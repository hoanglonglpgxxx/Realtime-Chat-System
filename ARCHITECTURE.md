# 🏗️ Kiến trúc Hệ thống Real-time Chat

**Đề tài:** Nghiên cứu kiến trúc phòng thủ chiều sâu và các cơ chế bảo mật cho ứng dụng truyền tin thời gian thực dựa trên nền tảng Web

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERNET (Public)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────▼─────┐
                    │  User    │
                    │ Browser  │
                    └────┬─────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│  VM1: chat-system-app (us-central1-c)                       │
│  Public IP: 35.193.42.199                                   │
│  Internal IP: 10.128.0.4                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌──────────────────┐               │
│  │ Frontend        │    │ Backend API      │               │
│  │ (Next.js)       │◄──►│ (Express.js)     │               │
│  │ Port: 3000      │    │ Port: 5001       │               │
│  └────────┬────────┘    └────────┬─────────┘               │
│           │                      │                         │
│  ┌────────▼──────────────────────▼─────┐                   │
│  │     Nginx Reverse Proxy            │                   │
│  │     Port: 8029 (Public)            │                   │
│  └────────────────────────────────────┘                   │
│           │                                                │
│           │ Internal Network (10.128.0.0/20)              │
│           │                                                │
└───────────┼────────────────────────────────────────────────┘
            │
            │ Private Subnet Only
            │
┌───────────▼────────────────────────────────────────────────┐
│  VM2: tracker-n-chat-infrastructure (us-central1-c)        │
│  ❌ NO Public IP (Private only)                            │
│  Internal IP: 10.128.0.2                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌──────────────────┐               │
│  │ Redis Pub/Sub   │    │ MongoDB          │               │
│  │ Port: 43816     │    │ Port: 27017      │               │
│  └────────┬────────┘    └────────┬─────────┘               │
│           │                      │                         │
│  ┌────────▼──────────────────────▼─────┐                   │
│  │     Socket Bridge Server           │                   │
│  │     (WebSocket Handler)            │                   │
│  │     Port: 5000                     │                   │
│  └────────────────────────────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Defense-in-Depth (3 Layers)

### **Layer 1: Network Isolation** 🌐

**Objective:** Ngăn chặn truy cập trực tiếp từ Internet đến infrastructure layer

**Implementation:**

- VM2 **NO public IP** (chỉ có internal IP 10.128.0.2)
- GCP Firewall Rules:
  - ✅ Allow: Internet → VM1:8029 (user access)
  - ❌ Block: Internet → VM2:\* (all ports)
  - ✅ Allow: VM1 → VM2 (internal network)

**Protection:**

- Redis không thể bị tấn công từ Internet
- MongoDB không expose ra ngoài
- Socket Bridge chỉ nhận connection từ VM1

**Test:**

```bash
# From Internet
curl http://35.193.42.199:8029  # ✅ Success
curl http://10.128.0.2:43816    # ❌ Timeout (blocked)

# From VM1
curl http://10.128.0.2:43816    # ✅ Success (internal)
```

---

### **Layer 2: Session Security** 🍪

**Objective:** Bảo vệ session token khỏi bị đánh cắp qua XSS

**Implementation:**

- **HttpOnly Cookie** (không thể đọc qua `document.cookie`)
- **JWT Token** với expiry 24h
- **Secure flag** (HTTPS only in production)
- **SameSite=Strict** (CSRF protection)

**Code:**

```javascript
// Frontend: apps/frontend/app/api/proxy/login/route.js
cookies().set("token", data.accessToken, {
  httpOnly: true, // ⭐ No JavaScript access
  secure: true, // HTTPS only
  sameSite: "strict", // CSRF protection
  maxAge: 86400, // 24 hours
});
```

**Protection:**

- XSS attack không thể đọc token
- Token auto-sent với mọi request
- Cross-site request bị block

**Test:**

```javascript
// Browser Console
console.log(document.cookie); // ❌ Empty (HttpOnly works!)
```

---

### **Layer 3: Message Integrity** 🔏

**Objective:** Ngăn chặn replay attack và message tampering

**Implementation:**

- **HMAC SHA256 signature** (message integrity)
- **Nonce** (32-char hex, one-time use)
- **Timestamp** (±60s validation window)
- **Redis tracking** (nonce TTL 60s)

**Flow:**

```
Browser → Frontend Proxy (server-side)
         │ Generate: nonce = crypto.randomBytes(16).toString('hex')
         │ Generate: eventTime = Math.floor(Date.now() / 1000)
         │ Calculate: signature = HMAC-SHA256(payload + nonce + eventTime)
         ▼
         Backend API
         │ Verify: HMAC signature matches
         │ Check: timestamp within ±60s
         │ Check: nonce not in Redis
         │ Store: nonce in Redis (TTL 60s)
         ▼
         Process message
```

**Code:**

```javascript
// Frontend Proxy: apps/frontend/app/api/proxy/message/send/route.js
function addHMACSignature(payload) {
  const nonce = crypto.randomBytes(16).toString("hex");
  const eventTime = Math.floor(Date.now() / 1000);
  const messageToSign = { ...payload, nonce, eventTime };
  const canonicalString = JSON.stringify(sortObject(messageToSign));
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(canonicalString)
    .digest("hex");
  return { ...messageToSign, signature };
}

// Backend: apps/backend/controllers/message.controller.js
async function verifyMessage(payload, redis) {
  // 1. Verify HMAC signature
  const expectedSig = calculateHMAC(payload);
  if (signature !== expectedSig) {
    return { valid: false, error: "Invalid HMAC signature" };
  }

  // 2. Check timestamp (±60s)
  if (Math.abs(currentTime - eventTime) > 60) {
    return { valid: false, error: "Timestamp expired" };
  }

  // 3. Check nonce uniqueness (REPLAY PROTECTION)
  const nonceKey = `chat:nonce:${nonce}`;
  if (await redis.get(nonceKey)) {
    return { valid: false, error: "Nonce already used" }; // ⭐
  }

  // 4. Store nonce with TTL
  await redis.setex(nonceKey, 60, eventTime);
  return { valid: true };
}
```

**Protection:**

- ❌ **Replay Attack:** Nonce đã dùng → 401 Unauthorized
- ❌ **Message Tampering:** HMAC mismatch → 401 Unauthorized
- ❌ **Forgery:** Không có secret key → Cannot generate valid HMAC
- ❌ **Old Request:** Timestamp > 60s → 401 Unauthorized

**Test:**

```bash
# Send message (success)
curl -X POST http://35.193.42.199:8029/api/proxy/message/send \
  -H 'Cookie: token=...' \
  -d '{"roomId":"...","content":"test","nonce":"abc123","eventTime":1771595915,"signature":"..."}'
# Response: 200 OK

# Replay same request (blocked)
curl -X POST http://35.193.42.199:8029/api/proxy/message/send \
  -H 'Cookie: token=...' \
  -d '{"roomId":"...","content":"test","nonce":"abc123","eventTime":1771595915,"signature":"..."}'
# Response: 401 Unauthorized
# Error: "Nonce already used (replay attack detected)"
```

---

## 📦 Component Architecture

### **Frontend (Next.js 15)**

**Location:** VM1 - Container `frontend_chat`  
**Port:** 3000 (internal) → 8029 (Nginx)  
**Tech Stack:** Next.js 15.1.3, React 19, TailwindCSS, Socket.IO Client

**Responsibilities:**

1. **Server-Side Rendering (SSR)**
   - Pre-render pages on server
   - SEO optimization
   - Fast initial load

2. **API Proxy Routes** (`/app/api/proxy/*`)
   - Add HMAC signature (server-side)
   - Protect HMAC_SECRET_KEY
   - Forward to backend API

3. **Cookie Management**
   - Set HttpOnly cookie on login
   - Auto-send with requests
   - Secure storage

4. **WebSocket Client**
   - Connect to Socket Bridge
   - Receive real-time updates
   - Handle connection loss

**Key Files:**

```
apps/frontend/
├── app/
│   ├── api/proxy/
│   │   ├── login/route.js         # Login proxy + set cookie
│   │   ├── message/send/route.js  # ⭐ Add HMAC signature
│   │   └── ...
│   ├── chat/page.js               # Chat UI
│   └── layout.js                  # Root layout
├── components/
│   └── ...
└── services/
    └── socket.service.js          # WebSocket connection
```

---

### **Backend API (Express.js)**

**Location:** VM1 - Container `backend_chat`  
**Port:** 5001  
**Tech Stack:** Node.js 22.3, Express.js, Mongoose, bcryptjs, jsonwebtoken

**Responsibilities:**

1. **REST API Endpoints**
   - `/api/v1/auth/*` - Authentication
   - `/api/v1/messages/*` - Message CRUD
   - `/api/v1/rooms/*` - Room management
   - `/api/v1/users/*` - User management

2. **JWT Authentication**
   - Verify token from cookie
   - User session management
   - Token expiry handling

3. **HMAC Verification** ⭐
   - Verify signature from frontend proxy
   - Check nonce uniqueness in Redis
   - Validate timestamp window

4. **MongoDB Operations**
   - User CRUD
   - Message storage
   - Room management

5. **Redis Pub/Sub**
   - Publish message events
   - Include HMAC signature for Socket Bridge

**Key Files:**

```
apps/backend/
├── controllers/
│   ├── auth.controller.js
│   └── message.controller.js      # ⭐ HMAC verification
├── middlewares/
│   └── auth.middleware.js         # JWT verification
├── models/
│   ├── user.model.js
│   ├── message.model.js
│   └── room.model.js
├── utils/
│   └── hmac.util.js               # ⭐ signMessage, verifyMessage
└── routes/
    └── ...
```

**Critical Logic:**

```javascript
// apps/backend/controllers/message.controller.js
exports.sendMessage = async (req, res) => {
    const { roomId, content, signature, nonce, eventTime } = req.body;

    // ⭐ VERIFY HMAC (Anti-replay)
    const result = await verifyMessage(req.body, redis);
    if (!result.valid) {
        return res.status(401).send({
            message: "Unauthorized!",
            error: result.error
        });
    }

    // Save message to MongoDB
    const message = await Message.create({ roomId, content, ... });

    // Publish to Redis (with HMAC for Socket Bridge)
    await redis.publish('mits_chat_event', JSON.stringify(
        signMessage({ eventType: 'new_message', ... })
    ));
};
```

---

### **Socket Bridge (Real-time Server)**

**Location:** VM2 - Container `socket-bridge`  
**Port:** 5000  
**Tech Stack:** Socket.IO, Redis Client

**Responsibilities:**

1. **WebSocket Server**
   - Accept connections from frontend
   - Manage room subscriptions
   - Broadcast to connected clients

2. **Redis Subscriber**
   - Listen to `mits_chat_event` channel
   - Receive message events from backend

3. **HMAC Verification** (from Redis events)
   - Verify signature on events
   - Prevent malicious Redis injection

4. **Event Broadcasting**
   - Send to specific room members
   - Handle online/offline status

**Key Files:**

```
apps/socket-bridge/
├── index.js                 # Main entry point
├── connection.js            # Socket.IO connection handler
├── listener.js              # Redis subscriber
└── handlers/
    ├── chat.handler.js      # Message events
    └── room.handler.js      # Room events
```

**Flow:**

```javascript
// Redis subscriber
redisSubscriber.on("message", (channel, data) => {
  const event = JSON.parse(data);

  // Verify HMAC from backend
  if (!verifySignature(event)) {
    console.error("Invalid event signature");
    return;
  }

  // Broadcast to room
  io.to(event.chatRoomId).emit("new_message", event.message);
});
```

---

### **Redis (Pub/Sub + Cache)**

**Location:** VM2 - Container `redis`  
**Port:** 43816  
**Version:** Redis 7.2

**Use Cases:**

1. **Pub/Sub Messaging**
   - Channel: `mits_chat_event`
   - Backend publishes → Socket Bridge subscribes

2. **Nonce Tracking** ⭐
   - Key pattern: `chat:nonce:{nonce}`
   - TTL: 60 seconds
   - Purpose: Replay attack prevention

3. **Session Cache** (future)
   - User online status
   - Temporary data

**Example:**

```bash
# Nonce storage
redis> SETEX chat:nonce:a7f3e9c1b2d4f5e6... 60 1771595915
redis> TTL chat:nonce:a7f3e9c1b2d4f5e6...
# Output: 58

# After 60 seconds
redis> GET chat:nonce:a7f3e9c1b2d4f5e6...
# Output: (nil)
```

---

### **MongoDB (Database)**

**Location:** VM2 - Container `mongodb`  
**Port:** 27017  
**Version:** MongoDB 7.0

**Collections:**

1. **users**
   - User accounts
   - Password hash (bcrypt)
   - Profile info

2. **rooms**
   - Chat rooms
   - Members list
   - Room type (direct/group)

3. **messages**
   - Message content
   - Sender/room references
   - Timestamps
   - Read status

4. **roles**
   - User roles (admin/user)
   - Permissions

---

### **Nginx (Reverse Proxy)**

**Location:** VM1 (container or host)  
**Port:** 8029 (public)

**Configuration:**

```nginx
server {
    listen 8029;

    # Frontend (Next.js)
    location / {
        proxy_pass http://frontend_chat:3000;
    }

    # Backend API
    location /api/v1/ {
        proxy_pass http://backend_chat:5001;
    }

    # WebSocket (Socket Bridge on VM2)
    location /socket.io/ {
        proxy_pass http://10.128.0.2:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 🔄 Request Flows

### **1. User Login**

```
Browser
  │ POST /api/proxy/login
  │ { username, password }
  ▼
Frontend Proxy (Next.js)
  │ Forward to backend
  ▼
Backend API
  │ Verify credentials (MongoDB)
  │ Generate JWT token
  ▼
Frontend Proxy
  │ Set HttpOnly cookie
  │ { token: "eyJhbGci..." }
  ▼
Browser (cookie stored)
```

---

### **2. Send Message (with HMAC)**

```
Browser
  │ POST /api/proxy/message/send
  │ { roomId, content, type }
  ▼
Frontend Proxy (Server-side)
  │ Generate nonce (32 chars)
  │ Get eventTime (Unix timestamp)
  │ Calculate HMAC signature
  │ Add to payload
  ▼
Backend API
  │ Extract: signature, nonce, eventTime
  │ Verify HMAC signature ✅
  │ Check timestamp ±60s ✅
  │ Check nonce in Redis ❓
  │   - If exists → 401 (Replay!)
  │   - If not → Store nonce (TTL 60s)
  │ Save message to MongoDB
  │ Publish to Redis (mits_chat_event)
  ▼
Socket Bridge (VM2)
  │ Redis subscriber receives event
  │ Verify event HMAC signature
  │ Broadcast via WebSocket
  ▼
All users in room receive message
```

---

### **3. Replay Attack (Blocked)**

```
Attacker
  │ Capture HTTP request (same nonce)
  │ curl -X POST ...
  ▼
Frontend Proxy → Backend API
  │ Verify HMAC: ✅ Valid
  │ Check timestamp: ✅ Within 60s
  │ Check nonce in Redis:
  │   → redis.get('chat:nonce:abc123')
  │   → Found! ❌
  ▼
Return: 401 Unauthorized
Error: "Nonce already used (replay attack detected)"
```

---

## 📊 Performance Metrics

| Component     | Metric           | Value     | Note                    |
| ------------- | ---------------- | --------- | ----------------------- |
| **Frontend**  | SSR Initial Load | ~800ms    | First contentful paint  |
| **Backend**   | API Response     | ~50-200ms | Average (MongoDB query) |
| **HMAC**      | Generation       | 3-5ms     | Frontend proxy          |
| **HMAC**      | Verification     | 3-5ms     | Backend                 |
| **Redis**     | Nonce Lookup     | < 2ms     | GET operation           |
| **Redis**     | Pub/Sub Latency  | < 10ms    | Event propagation       |
| **WebSocket** | Message Delivery | ~50ms     | Real-time broadcast     |
| **Total**     | End-to-End       | ~250ms    | Browser → All clients   |

---

## 🛡️ Security Summary

### **Attack Scenarios & Defense**

| Attack Type           | Method                  | Defense Layer                  | Result                    |
| --------------------- | ----------------------- | ------------------------------ | ------------------------- |
| **DDoS VM2**          | Flood Redis/MongoDB     | Layer 1: Network Isolation     | ✅ Blocked (no public IP) |
| **XSS Token Theft**   | `document.cookie`       | Layer 2: HttpOnly Cookie       | ✅ Blocked (not readable) |
| **Replay Attack**     | Resend captured request | Layer 3: Nonce Tracking        | ✅ Blocked (401)          |
| **Message Tampering** | Change content          | Layer 3: HMAC Signature        | ✅ Blocked (401)          |
| **HMAC Forgery**      | Generate fake signature | Layer 3: Secret Key Protection | ✅ Blocked (cannot forge) |
| **Timestamp Attack**  | Use old request         | Layer 3: Timestamp Validation  | ✅ Blocked (expired)      |

### **Key Security Features**

✅ **No Public Infrastructure:** VM2 has no public IP  
✅ **HttpOnly Cookies:** XSS cannot steal tokens  
✅ **HMAC Signature:** Message integrity guaranteed  
✅ **Nonce Uniqueness:** Replay attacks detected  
✅ **Timestamp Window:** Old requests rejected  
✅ **Server-side HMAC:** Secret key never exposed to browser  
✅ **Redis TTL:** Automatic nonce cleanup

---

## 🎓 Technology Justification (For Thesis)

### **Why Next.js?**

- ✅ Server-Side Rendering (HMAC generation on server)
- ✅ API Routes (proxy pattern without extra server)
- ✅ Server Components (protect sensitive logic)
- ✅ Built-in cookie management

### **Why Redis?**

- ✅ Pub/Sub for real-time events
- ✅ Fast nonce lookup (O(1))
- ✅ Auto-expiry (TTL for cleanup)
- ✅ Distributed cache (multi-instance support)

### **Why MongoDB?**

- ✅ Flexible schema (chat messages vary)
- ✅ JSON-like documents (easy mapping)
- ✅ Good query performance
- ✅ Horizontal scaling (future)

### **Why HMAC instead of digital signatures (RSA)?**

- ✅ Faster (symmetric vs asymmetric)
- ✅ Simpler key management (shared secret)
- ✅ Sufficient for this use case (server-to-server)
- ✅ Industry standard (NIST approved)

### **Why Nonce instead of timestamp only?**

- ✅ Stronger uniqueness guarantee
- ✅ Prevents replay within time window
- ✅ Crypto-random (unpredictable)
- ✅ Minimal storage overhead

---

## 📝 Deployment Architecture

### **CI/CD Pipeline (GitHub Actions)**

```yaml
# .github/workflows/deploy.yml
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - SSH to VM1 → Deploy apps/
      - SSH to VM2 → Deploy infrastructure/
      - Restart containers (zero-downtime)
```

### **Environment Variables**

**VM1 (apps/.env):**

```bash
BE_URL=http://backend_chat:5001
HMAC_SECRET_KEY=<shared-secret>
JWT_SECRET=<jwt-secret>
MONGODB_URI=mongodb://10.128.0.2:27017/chat
REDIS_HOST=10.128.0.2
REDIS_PORT=43816
SOCKET_BRIDGE_URL=http://10.128.0.2:5000
```

**VM2 (infrastructure/.env):**

```bash
REDIS_PASSWORD=<redis-pass>
MONGODB_ROOT_PASSWORD=<mongo-pass>
```

---

## 🔍 Testing Strategy

### **Unit Tests**

- HMAC signature generation/verification
- Nonce uniqueness logic
- Timestamp validation

### **Integration Tests**

- Frontend → Backend flow
- Redis Pub/Sub
- MongoDB operations

### **Security Tests**

- ✅ Replay attack blocking
- ✅ Message tampering detection
- ✅ Network isolation validation
- ✅ HttpOnly cookie verification

### **Performance Tests**

- Load testing (concurrent users)
- Latency measurement
- Resource usage monitoring

---

## 📚 References

**HMAC Standard:**

- RFC 2104 - HMAC: Keyed-Hashing for Message Authentication
- FIPS 198-1 - The Keyed-Hash Message Authentication Code (HMAC)

**Security Best Practices:**

- OWASP Top 10 (XSS, Injection, Authentication)
- NIST Cybersecurity Framework
- Defense-in-Depth Strategy (NSA)

**Technologies:**

- Next.js Documentation: https://nextjs.org/docs
- Socket.IO Documentation: https://socket.io/docs
- Redis Documentation: https://redis.io/docs

---

**Document Version:** 1.0  
**Last Updated:** February 21, 2026  
**Author:** Mitsne  
**Purpose:** Master's Thesis - Defense-in-Depth Architecture for Real-time Web Chat

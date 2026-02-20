# ⚡ CHẠY TESTS TỪ VM - QUICK GUIDE

**Workflow hoàn toàn trên VM1 - Không cần chạy gì từ local PC**

---

## 🎯 CHẠY NGAY (3 Commands)

```bash
# 1. SSH vào VM1 (từ local PC - chỉ dùng SSH)
gcloud compute ssh chat-system-app --zone=us-central1-c

# 2. Setup môi trường (chạy 1 lần duy nhất)
cd /home/mitsne/realtime-chat && chmod +x tests/*.sh && ./tests/setup-vm-test-env.sh && source tests/.env

# 3. Chạy tất cả tests
./tests/run-all-scenarios.sh
```

**Done! 🎉**

---

## 📋 Chi Tiết Từng Bước

### Bước 1: SSH vào VM1

```bash
# Từ Windows PowerShell hoặc terminal
gcloud compute ssh chat-system-app --zone=us-central1-c
```

### Bước 2: Setup Test Environment (First Time Only)

```bash
cd /home/mitsne/realtime-chat

# Make scripts executable
chmod +x tests/*.sh

# Run auto-setup (tự động detect IPs + HMAC key)
./tests/setup-vm-test-env.sh
```

**Script sẽ tự động:**

- ✅ Detect VM1 public IP: `34.71.X.X`
- ✅ Detect VM1 internal IP: `10.128.0.X`
- ✅ Detect VM2 internal IP: `10.128.0.Y` (từ docker-compose.yml)
- ✅ Extract HMAC key từ backend container
- ✅ Generate `/home/mitsne/realtime-chat/tests/.env`

**Load environment:**

```bash
source tests/.env
```

You only need to do this once. The `.env` file persists.

### Bước 3: Chạy Tests

**Option A: Chạy tất cả kịch bản (Recommended)**

```bash
./tests/run-all-scenarios.sh
```

**Output:**

```
========================================
  KỊCH BẢN 1: NETWORK ISOLATION
========================================
✅ PASS: VM2 không có External IP
✅ PASS: VM1:8029 accessible
✅ PASS: VM2:43816 blocked
✅ PASS: VM2:27017 blocked

========================================
  KỊCH BẢN 2: HTTPONLY COOKIE
========================================
[Interactive guide...]

========================================
  KỊCH BẢN 3: REPLAY ATTACK
========================================
✅ Normal request: SUCCESS
❌ Replay attack: BLOCKED (401)
❌ Expired request: BLOCKED (401)
```

**Option B: Chạy từng kịch bản**

```bash
# Scenario 1: Network isolation
./tests/scenario1-network-isolation.sh

# Scenario 2: HttpOnly cookie (interactive)
./tests/scenario2-httponly-cookie.sh

# Scenario 3: Replay attack
cd tests && node replay-attack-demo.js
```

---

## 🔍 Verify Setup

### Check environment variables:

```bash
echo $VM1_PUBLIC_IP
echo $VM1_INTERNAL_IP
echo $VM2_INTERNAL_IP
echo $HMAC_SECRET_KEY
```

### Check .env file:

```bash
cat tests/.env
```

Should show:

```bash
export VM1_PUBLIC_IP=34.71.X.X
export VM1_INTERNAL_IP=10.128.0.X
export VM2_INTERNAL_IP=10.128.0.Y
export HMAC_SECRET_KEY=abc123...
```

---

## 🐛 Troubleshooting

### Problem: VM2_INTERNAL_IP not detected

**Solution: Manually set it**

```bash
# Get VM2 IP from docker-compose.yml
grep REDIS_HOST /home/mitsne/realtime-chat/apps/docker-compose.yml

# Or from .env
grep VM2_INTERNAL /home/mitsne/realtime-chat/apps/.env

# Set manually
export VM2_INTERNAL_IP="10.128.0.Y"
```

### Problem: HMAC_SECRET_KEY empty

**Solution: Get from container**

```bash
docker exec backend_chat env | grep HMAC_SECRET_KEY

# Copy the value
export HMAC_SECRET_KEY="your-actual-key"
```

### Problem: Tests fail with "connection refused"

**Check containers are running:**

```bash
docker ps
```

Should see: `frontend_chat`, `backend_chat`, `nginx_chat`

**Restart if needed:**

```bash
cd /home/mitsne/realtime-chat/apps
docker compose restart
```

---

## 📊 Expected Results

| Test                    | Expected | Actual | Status |
| ----------------------- | -------- | ------ | ------ |
| VM2 has no public IP    | ✅       | ✅     | PASS   |
| VM1:8029 accessible     | ✅       | ✅     | PASS   |
| VM2:43816 blocked       | ❌       | ❌     | PASS   |
| VM2:27017 blocked       | ❌       | ❌     | PASS   |
| HttpOnly cookie set     | ✅       | ✅     | PASS   |
| HMAC signature valid    | ✅       | ✅     | PASS   |
| Replay attack blocked   | ❌       | ❌     | PASS   |
| Expired request blocked | ❌       | ❌     | PASS   |

**All 8 tests should PASS** ✅

---

## 🎓 For Thesis

**Screenshots to capture:**

1. ✅ Setup output (VM IPs detected)
2. ✅ Scenario 1 output (Network isolation)
3. ✅ Browser DevTools (HttpOnly cookie)
4. ✅ Replay attack output (3 scenarios)
5. ✅ Redis CLI (nonce tracking)

**Files created:**

- `/home/mitsne/realtime-chat/tests/.env` - Environment config
- Test outputs and logs

**Commands to show in thesis:**

```bash
./tests/setup-vm-test-env.sh     # Auto-setup
./tests/run-all-scenarios.sh     # Run all tests
```

---

## ✅ Summary

**What you DON'T need:**

- ❌ gcloud CLI on VM
- ❌ Manual IP detection
- ❌ Manual HMAC key extraction
- ❌ Running tests from local PC

**What you DO:**

1. ✅ SSH to VM1 (1 command)
2. ✅ Run setup script (auto-detect everything)
3. ✅ Run tests (1 command)

**Total: 3 commands** 🚀

---

**Last updated:** February 20, 2026  
**Next:** See [DEFENSE_IN_DEPTH_DEMO.md](../notes/DEFENSE_IN_DEPTH_DEMO.md) for detailed methodology

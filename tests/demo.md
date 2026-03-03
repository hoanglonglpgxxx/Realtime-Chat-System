# DEMO STEP

## DEMO 1: Gửi tin

`docker logs frontend_chat --tail 20`

`docker logs backend_chat --tail 40`

## DEMO 2: Replay Attack

```bash
curl -X POST 'http://35.193.42.199:8029/api/proxy/message/send' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: JWT_TOKEN' \
  --data '{
    "roomId": "ROOM_ID",
    "content": "chào",
    "type": "text",
    "nonce": "NONCE",
    "eventTime": TIME,
    "signature": "SIGN"
  }'
```

//content PHẢI giống

## DEMO 3: Message Tampering

```bash
curl -X POST 'http://35.193.42.199:8029/api/proxy/message/send' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: JWT_TOKEN' \
  --data '{
    "roomId": "ROOM_ID",
    "content": "HACKED MESSAGE <script>alert(1)</script>",
    "type": "text",
    "nonce": "NONCE",
    "eventTime": TIME,
    "signature": "SIGN"
  }'
```

//NONCE LUNG TUNG cũng được vì cứ sai 1 field = tạo sign khác

## DEMO 4: Verify Nonce trong Redis

```bash
# SSH vào VM2 (hoặc từ VM1 if Redis is accessible)
docker exec -it redis_chat redis-cli

AUTH mitsneredis

# Xem tất cả nonce đã lưu
KEYS chat:nonce:*

# Check TTL (Time To Live)
TTL chat:nonce:ID

# Output: 58 (seconds remaining, max 60)
```

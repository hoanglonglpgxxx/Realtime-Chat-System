# DEMO STEP

## DEMO 1: Gửi tin

`docker logs frontend_chat --tail 20`

`docker logs backend_chat --tail 30`

## DEMO 2: Replay Attack

```bash
curl -X POST 'http://35.193.42.199:8029/api/proxy/message/send' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODQ0MTQ0YzllYjQ1MTM1ZmM2YjM1NyIsImlhdCI6MTc3MjU1MDAzMywiZXhwIjoxNzcyNjM2NDMzfQ.4qTgu1kfvYVrU5gHaAEuakPSiqPXR3uH8FWzl_M-7gE' \
  --data '{
    "roomId": "ROOM",
    "content": "xin chào",
    "type": "text",
    "nonce": "NONCE",
    "eventTime": 1772550044,
    "signature": "SIGN"
  }'
```

## DEMO 3: Message Tampering

```bash
curl -X POST 'http://35.193.42.199:8029/api/proxy/message/send' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODQ0MTQ0YzllYjQ1MTM1ZmM2YjM1NyIsImlhdCI6MTc3MjU1MDAzMywiZXhwIjoxNzcyNjM2NDMzfQ.4qTgu1kfvYVrU5gHaAEuakPSiqPXR3uH8FWzl_M-7gE' \
  --data '{
    "roomId": "69973f98b5d336734c827b87",
    "content": "HACKED MESSAGE <script>alert(1)</script>",
    "type": "text",
    "nonce": "cd3cc8b6c811a4a46ece1456e5e9c800",
    "eventTime": '1772550743',
    "signature": "11e58a9562c7fe6e07e8b68a0a9717db3afedce39ed420038c81460a1910bc32"
  }'
```

## DEMO 4: Verify Nonce trong Redis

```bash
# SSH vào VM2 (hoặc từ VM1 if Redis is accessible)
docker exec -it redis_chat redis-cli

AUTH mitsneredis

# Xem tất cả nonce đã lưu
KEYS chat:nonce:*

# Check TTL (Time To Live)
TTL chat:nonce:27db417198ce78969266f8e274afb4ed

# Output: 58 (seconds remaining, max 60)
```

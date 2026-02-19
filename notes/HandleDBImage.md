1. mongosh -u admin -p mitsne --authenticationDatabase admin
2. use realtime-chat
3. show collections
4. db.roles.find().limit(5).pretty()
5. # SSH vào VM2
   docker exec -it redis_chat redis-cli
   AUTH your_password

# Subscribe vào chat events

SUBSCRIBE mits_chat_event

# Gửi message từ browser → sẽ thấy event xuất hiện realtime!

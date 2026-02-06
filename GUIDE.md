# Guide chuyển hạ tầng

1. down Mongo DB tools
2. dump data: mongodump --uri "mongodb+srv://<name>:<pass>@cluster0.xxx.mongodb.net/realtime-chat" --out ./atlas_backup
   & "C:\Users\longlh\MongoTools\bin\mongodump.exe" --uri "mongodb+srv://<name>:<pass>cluster0.rfwzvbn.mongodb.net/realtime-chat" --out ./atlas_backup

# Đẩy thư mục backup lên VM

scp -r -i "C:\Users\longlh\Downloads\google_key_openssh" .\atlas_backup hoanglonglpgxxx@34.70.65.137:~/

# Ra lệnh cho Container MongoDB trên VM import dữ liệu

docker exec -i mongodb_nodeshield mongorestore --username admin --password YourSecurePassword --authenticationDatabase admin --nsInclude="realtime-chat.\*" /atlas_backup

# Chuyển sang điều khiển VM

docker context use remote-vm

# Chạy lệnh (Docker sẽ đọc file .yml ở Windows và tạo container ở VM)

docker compose up -d

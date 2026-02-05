const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
    name: {
        type: String,
        // Đối với chat 1-1, name có thể null (sẽ lấy tên của đối phương hiển thị)
        required: false,
    },
    // Phải dùng mảng ObjectId để tham chiếu đến User
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }],
    // Chủ phòng (thường chỉ dùng cho Group)
    owners: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    avatar: String,
    // Một phòng thường chỉ có 1 loại (1-1 hoặc Group)
    roomType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RoomType",
        required: true,
    },
    // NÊN THÊM: Để hiển thị tin nhắn mới nhất ở danh sách chat
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    }
}, { timestamps: true });

const Room = mongoose.model("Room", RoomSchema);
module.exports = Room;
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    // Phòng chat mà tin nhắn thuộc về
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true,
        index: true, // Index để query nhanh
    },
    // Người gửi
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Nội dung tin nhắn
    content: {
        type: String,
        required: true,
        maxlength: 5000, // Giới hạn độ dài
    },
    // Loại tin nhắn: text, image, file, system (notification)
    type: {
        type: String,
        enum: ['text', 'image', 'file', 'system'],
        default: 'text',
    },
    // Trạng thái đã đọc (array of user IDs đã xem)
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    // Metadata tùy chọn (cho file, image)
    metadata: {
        fileName: String,
        fileSize: Number,
        mimeType: String,
        url: String, // URL của file/image nếu có
    },
    // Soft delete
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true, // createdAt, updatedAt
});

// Index compound để query tin nhắn trong room theo thời gian
MessageSchema.index({ room: 1, createdAt: -1 });

// Index để tìm tin nhắn chưa đọc
MessageSchema.index({ room: 1, readBy: 1 });

const Message = mongoose.model('Message', MessageSchema);
module.exports = Message;

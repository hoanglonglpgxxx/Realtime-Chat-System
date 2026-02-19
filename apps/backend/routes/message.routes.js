const express = require('express');
const router = express.Router();
const messageController = require('../controllers/message.controller');
const authJwt = require('../middlewares/auth.middleware');

// Tất cả routes đều cần authentication
router.use(authJwt.verifyToken);

/**
 * @route POST /api/v1/messages/send
 * @desc Gửi tin nhắn
 * @access Private
 */
router.post('/send', messageController.sendMessage);

/**
 * @route GET /api/v1/messages/:roomId
 * @desc Lấy tin nhắn trong room
 * @access Private
 */
router.get('/:roomId', messageController.getMessages);

/**
 * @route PUT /api/v1/messages/:messageId/read
 * @desc Đánh dấu đã đọc
 * @access Private
 */
router.put('/:messageId/read', messageController.markAsRead);

module.exports = router;

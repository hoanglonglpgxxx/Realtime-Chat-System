const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const authJwt = require('../middlewares/auth.middleware');

// Tất cả routes đều cần authentication
router.use(authJwt.verifyToken);

/**
 * @route POST /api/v1/rooms/find-or-create
 * @desc Tìm hoặc tạo room 1-1
 * @access Private
 */
router.post('/find-or-create', roomController.findOrCreateDirectRoom);

/**
 * @route GET /api/v1/rooms/my-rooms
 * @desc Lấy danh sách rooms của user
 * @access Private
 */
router.get('/my-rooms', roomController.getMyRooms);

/**
 * @route POST /api/v1/rooms/create-group
 * @desc Tạo group room
 * @access Private
 */
router.post('/create-group', roomController.createGroupRoom);

module.exports = router;

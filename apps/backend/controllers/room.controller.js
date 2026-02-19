const db = require('../models');
const Room = db.room;
const RoomType = db.roomType;
const User = db.user;

/**
 * Tìm hoặc tạo room 1-1 giữa 2 users
 * @route POST /api/v1/rooms/find-or-create
 */
exports.findOrCreateDirectRoom = async (req, res) => {
    try {
        const currentUserId = req.userId; // Từ auth middleware
        const { otherUserId } = req.body;

        if (!otherUserId) {
            return res.status(400).send({ message: "otherUserId is required" });
        }

        if (currentUserId === otherUserId) {
            return res.status(400).send({ message: "Cannot create room with yourself" });
        }

        // Kiểm tra user có tồn tại không
        const otherUser = await User.findById(otherUserId);
        if (!otherUser) {
            return res.status(404).send({ message: "User not found" });
        }

        // Tìm roomType "person" (1-1 chat)
        const personRoomType = await RoomType.findOne({ name: 'person' });
        if (!personRoomType) {
            return res.status(500).send({ message: "Room type 'person' not found in database" });
        }

        // Tìm room đã tồn tại giữa 2 users
        // Room 1-1 có members là array chứa đúng 2 users
        const existingRoom = await Room.findOne({
            roomType: personRoomType._id,
            members: { $all: [currentUserId, otherUserId], $size: 2 }
        })
            .populate('members', 'username fullName avatar')
            .populate('lastMessage');

        if (existingRoom) {
            return res.status(200).send({
                room: existingRoom,
                isNew: false,
            });
        }

        // Tạo room mới
        const newRoom = new Room({
            members: [currentUserId, otherUserId],
            roomType: personRoomType._id,
            // Room 1-1 không cần name, UI sẽ hiển thị tên của đối phương
        });

        await newRoom.save();

        // Populate để trả về đầy đủ thông tin
        const populatedRoom = await Room.findById(newRoom._id)
            .populate('members', 'username fullName avatar')
            .populate('roomType', 'name');

        res.status(201).send({
            room: populatedRoom,
            isNew: true,
        });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

/**
 * Lấy danh sách rooms của user hiện tại
 * @route GET /api/v1/rooms/my-rooms
 */
exports.getMyRooms = async (req, res) => {
    try {
        const userId = req.userId;

        const rooms = await Room.find({
            members: userId
        })
            .populate('members', 'username fullName avatar')
            .populate('roomType', 'name')
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'sender',
                    select: 'username fullName'
                }
            })
            .sort({ updatedAt: -1 }); // Sắp xếp theo room có activity mới nhất

        res.status(200).send({ rooms });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

/**
 * Tạo group room
 * @route POST /api/v1/rooms/create-group
 */
exports.createGroupRoom = async (req, res) => {
    try {
        const currentUserId = req.userId;
        const { name, memberIds, avatar } = req.body;

        if (!name) {
            return res.status(400).send({ message: "Group name is required" });
        }

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).send({ message: "At least one member is required" });
        }

        // Tìm roomType "group"
        const groupRoomType = await RoomType.findOne({ name: 'group' });
        if (!groupRoomType) {
            return res.status(500).send({ message: "Room type 'group' not found" });
        }

        // Thêm current user vào members nếu chưa có
        const allMembers = [...new Set([currentUserId, ...memberIds])];

        const newRoom = new Room({
            name,
            members: allMembers,
            owners: [currentUserId], // Creator là owner
            roomType: groupRoomType._id,
            avatar: avatar || '',
        });

        await newRoom.save();

        const populatedRoom = await Room.findById(newRoom._id)
            .populate('members', 'username fullName avatar')
            .populate('owners', 'username fullName')
            .populate('roomType', 'name');

        res.status(201).send({ room: populatedRoom });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

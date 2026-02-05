const config = require('../config/auth.config');
const db = require('../models');
const User = db.user;
const Role = db.role;

let jwt = require('jsonwebtoken');
let bcrypt = require('bcryptjs');

// auth.controller.js

exports.signup = async (req, res) => {
    try {
        let rolesData = [];
        if (!req.body.password || !req.body.username) return res.status(400).send({ message: "Missing important fields" });
        if (req.body.roles && Array.isArray(req.body.roles)) {
            rolesData = await Role.find({ name: { $in: req.body.roles } });

            if (!rolesData || rolesData.length === 0) {
                return res.status(400).send({ message: "Roles not found!" });
            }
        } else {
            const defaultRole = await Role.findOne({ name: "user" });
            if (!defaultRole) {
                return res.status(500).send({ message: "Default role not found in database!" });
            }
            rolesData = [defaultRole];
        }

        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, 8),
            fullName: req.body.fullName,
            avatar: req.body.avatar || '',
            roles: rolesData.map(role => role._id), // Chỉ lưu ID để tối ưu storage
        });

        await user.save();
        res.status(201).send({ message: "User was registered successfully!" });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};
exports.login = async (req, res) => {
    try {
        // Kiểm tra đầu vào
        if (!req.body.username || !req.body.password) {
            return res.status(400).send({ message: "Username and password are required!" });
        }

        // Tìm user theo username
        const user = await User.findOne({ username: req.body.username }).select('+password').populate("roles", "-__v");
        if (!user || !user.password) {
            return res.status(401).send({ message: "Invalid credentials!" });
        }

        // Kiểm tra mật khẩu
        const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
        if (!passwordIsValid) {
            return res.status(401).send({
                accessToken: null,
                message: "Invalid credentials!"
            });
        }

        // Tạo JWT token
        const token = jwt.sign({ id: user.id }, config.secret, {
            algorithm: 'HS256', // HMAC with SHA256
            expiresIn: 86400, // 24 hours
        });

        // Lấy danh sách vai trò
        const authorities = user.roles.map(role => "ROLE_" + role.name.toUpperCase());

        // Trả về thông tin user và token
        res.status(200).send({
            id: user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            avatar: user.avatar || '',
            roles: authorities,
            accessToken: token
        });
    } catch (err) {
        res.status(500).send({ message: err.message || "An error occurred during login." });
    }
};
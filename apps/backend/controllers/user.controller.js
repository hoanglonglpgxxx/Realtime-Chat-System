const db = require('../models');
const User = db.user;

exports.selectAll = async (req, res) => {
    try {
        const users = await User.find()
            .select('username email fullName avatar createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({
            users: users
        });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

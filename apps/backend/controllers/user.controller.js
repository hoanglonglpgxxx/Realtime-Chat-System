const db = require('../models');
const User = db.user;
exports.selectAll = async (req, res) => {
    try {
        const users = await User.find().limit(5);
        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                data: users
            }
        });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
};

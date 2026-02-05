const mongoose = require("mongoose");

const EMAIL_REG_EXP = /^[a-zA-Z0-9]([A-Za-z0-9_-]|([.])(?!\2)){1,63}@[a-zA-Z0-9_-]{2,250}(\.[a-zA-Z0-9]{2,4}){1,3}$/;

const isEmail = {
    validator: function (val) {
        return EMAIL_REG_EXP.test(val);
    },
    message: 'Email is invalid '
};

const User = mongoose.model(
    "User",
    new mongoose.Schema({
        username: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            minlength: 6,
            lowercase: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
            validate: [isEmail]
        },
        fullName: {
            type: String,
            trim: true,
            required: [true, 'Please provide full name'],
        },
        password: {
            type: String,
            required: [true, 'Please provide password'],
            minlength: 8,
            select: false
        },
        avatar: String,
        lastActiveTime: Date,
        roles: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Role",
            },
        ],
    }, { timestamps: true }) //add timestamps: true thì tự sinh createdAt và updateAt
);

module.exports = User;

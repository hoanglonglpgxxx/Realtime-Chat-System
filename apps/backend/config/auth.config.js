const crypto = require("crypto");

module.exports = {
    secret: process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex"),
};

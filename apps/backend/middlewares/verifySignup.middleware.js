const db = require("../models");
const ROLES = db.ROLES;
const User = db.user;

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
    try {
        // Kiểm tra Username
        const userByUsername = await User.findOne({ username: req.body.username });
        if (userByUsername) {
            return res.status(400).send({ message: "Failed! Username is already in use!" });
        }

        // Kiểm tra Email
        const userByEmail = await User.findOne({ email: req.body.email });
        if (userByEmail) {
            return res.status(400).send({ message: "Failed! Email is already in use!" });
        }

        next();
    } catch (err) {
        res.status(500).send({ message: err.message || "Internal Server Error" });
    }
};

const checkRolesExisted = (req, res, next) => {
    if (req.body.roles) {
        const rolesInput = Array.isArray(req.body.roles)
            ? req.body.roles
            : [req.body.roles];

        for (let i = 0; i < rolesInput.length; i++) {
            if (!ROLES.includes(rolesInput[i])) {
                return res.status(400).send({
                    message: `Failed! Role ${rolesInput[i]} does not exist!`,
                });
            }
        }
    }
    next();
};
const verifySignUp = {
    checkDuplicateUsernameOrEmail,
    checkRolesExisted,
};

module.exports = verifySignUp;
const { verifySignUp } = require('../middlewares');
const controller = require('../controllers/auth.controller');

const express = require('express');
const router = express.Router();


// Thiết lập CORS Header riêng cho cụm Auth nếu cần
router.use((req, res, next) => {
    res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
    );
    next();
});


router.post("/signup", [
    verifySignUp.checkDuplicateUsernameOrEmail,
    verifySignUp.checkRolesExisted], controller.signup);

router.post("/login", controller.login);

module.exports = router;
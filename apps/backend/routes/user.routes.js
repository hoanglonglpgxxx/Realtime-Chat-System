const { authJwt } = require("../middlewares");
const controller = require("../controllers/user.controller");

const express = require('express');
const router = express.Router();

router.use((req, res, next) => {
    res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
    );
    next();
});

router.get('/selectAll', controller.selectAll);

module.exports = router;

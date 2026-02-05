const mongoose = require("mongoose");
const RoomType = mongoose.model(
    "RoomType",
    new mongoose.Schema({
        name: String,
    })
);

module.exports = RoomType;

const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

const db = {};

db.user = require("./user.model");
db.role = require("./role.model");
db.room = require("./room.model");
db.roomType = require('./roomType.model');

db.ROOMTYPES = ["person", "group"];
db.ROLES = ["user", "admin", "moderator"];

module.exports = db;

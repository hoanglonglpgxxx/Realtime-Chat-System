const db = require("../models");
const Role = db.role;
const RoomType = db.roomType;
async function seedingRoles() {
    // The estimatedDocumentCount() function is quick as it estimates the number of documents in the MongoDB collection. It is used for large collections because this function uses collection metadata rather than scanning the entire collection.

    try {
        const count = await Role.estimatedDocumentCount();

        if (count === 0) {
            await new Role({ name: "user" }).save();
            console.log("added 'user' to roles collection");

            await new Role({ name: "moderator" }).save();
            console.log("added 'moderator' to roles collection");

            await new Role({ name: "admin" }).save();
            console.log("added 'admin' to roles collection");
        }
    } catch (err) {
        console.error("Error initializing roles", err);
    }
}
async function seedingRoomTypes() {
    try {
        const count = await RoomType.estimatedDocumentCount();

        if (count === 0) {
            await new RoomType({ name: "person" }).save();
            console.log("added 'person' to roomtypes collection");

            await new RoomType({ name: "group" }).save();
            console.log("added 'group' to roomtypes collection");
        }
    } catch (err) {
        console.error("Error initializing room types", err);
    }
}
module.exports = {
    seedingRoles,
    seedingRoomTypes
};
const mongoose = require('mongoose');

//catch event uncaughtException, xử lý cho synchro code, khi có lỗi sẽ trigger event này
process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! Shutting down.....');
    console.log(err.name, err.message);
    process.exit(1);
});

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: '../../.env' });
}

//prod thì bỏ cmt dòng dưới
const DB = process.env.DB_URI || process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
// const DB = "mongodb+srv://mitsngeither:<FAKEPASS>@cluster0.rfwzvbn.mongodb.net/realtime-chat?retryWrites=true&w=majority";
const connectDB = async () => {
    try {
        await mongoose.connect(
            DB, {
            sanitizeFilter: true
            // useUnifiedTopology: true,
            // useNewUrlParser: true
        }
        );
    }
    catch (err) {
        console.error(err);
    }
};

module.exports = connectDB;
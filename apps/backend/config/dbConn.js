const mongoose = require('mongoose');
const dotenv = require('dotenv');

//catch event uncaughtException, xử lý cho synchro code, khi có lỗi sẽ trigger event này
process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! Shutting down.....');
    console.log(err.name, err.message);
    process.exit(1);
});

dotenv.config({ path: '../../.env' });

const DB = process.env.DB_URI.replace(
    '<PASSWORD>', encodeURIComponent(process.env.DB_PASSWORD)
);

const connectDB = async () => {
    try {
        await mongoose.connect(
            DB, {
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
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/dbConn');

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.BE_PORT || 5000;

app.get('/', (req, res) => {
    res.send('Backend Realtime Chat is Running!');
});

connectDB();

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');

    app.listen(PORT, () => {
        console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    });
});


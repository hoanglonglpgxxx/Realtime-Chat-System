const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require("body-parser");
const cors = require("cors");
const connectDB = require('./config/db.config');
const authRouter = require('./routes/auth.routes');
// const { seedingRoomTypes } = require('./test/seeding.test');
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.BE_PORT || 5000;

app.use(cors({
    // origin: 'https://example.com', // Allow only this domain to access the resources
    // methods: ['GET', 'POST'], // Allow only these methods
    // allowedHeaders: ['Content-Type', 'Authorization'], // Allow only these headers
    credentials: true, // Allow cookies
}));

app.options('all', cors());

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Backend Realtime Chat is Running!');
});

connectDB();
const db = require("../backend/models/index");
const Role = db.role;
mongoose.connection.once('open', async () => {
    console.log('Connected to MongoDB');

    try {
        const result = await mongoose.connection.db.admin().listDatabases();
        // seedingRoomTypes();
    } catch (err) {
        console.error('Error listing databases:', err);
    }

    app.listen(PORT, () => {
        console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    });
});

app.use('/api/v1/auth', authRouter);
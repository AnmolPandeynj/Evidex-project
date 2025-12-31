import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Request logger
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});

import apiRoutes from './routes/api';

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

app.use('/api', apiRoutes);

// Basic health check
app.get('/', (req, res) => {
    res.send('Evidex Server is running');
});

const startServer = async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.warn("WARNING: MONGO_URI is missing in .env");
        } else {
            // Basic mongo connection test
            const client = new MongoClient(process.env.MONGO_URI, {
                tlsInsecure: true // Bypass SSL verification for development to avoid ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR
            });
            await client.connect();
            console.log("Connected to MongoDB");
        }
    } catch (error) {
        console.error("Failed to connect to MongoDB:", error);
        console.warn("Server starting without persistent database connection.");
    }

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
};

startServer().catch(err => {
    console.error("Fatal server error:", err);
});

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from server root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const checkUsers = async () => {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI not found");
        process.exit(1);
    }

    const client = new MongoClient(process.env.MONGO_URI);

    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const db = client.db("evidex");
        const users = await db.collection("users").find({}).sort({ lastLogin: -1 }).toArray();

        console.log("\n--- User Database Entries ---");
        if (users.length === 0) {
            console.log("No users found.");
        } else {
            users.forEach(user => {
                console.log(`Email: ${user.email}`);
                console.log(`UID: ${user.uid}`);
                console.log(`Last Login: ${user.lastLogin}`);
                console.log(`Created At: ${user.createdAt}`);
                console.log("-------------------------");
            });
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await client.close();
    }
};

checkUsers();

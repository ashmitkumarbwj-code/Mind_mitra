import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CheckIn from './src/models/CheckIn.js';
import './src/models/User.js'; // Ensure models registered

dotenv.config();

async function verify() {
    try {
        console.log("🔍 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected!");

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("📂 Collections in DB:", collections.map(c => c.name));

        const count = await mongoose.model('CheckIn').countDocuments();
        console.log("📊 Total Check-ins in DB:", count);

        console.log("🔍 Querying latest record...");
        const latest = await mongoose.model('CheckIn').findOne().sort({ createdAt: -1 }).lean();

        if (latest) {
            console.log("\n--- LATEST CHECK-IN ---");
            console.log("ID:", latest._id);
            console.log("UserID:", latest.userId);
            console.log("Message:", latest.rawMessage);
            console.log("Sentiment Score:", latest.sentimentScore);
            console.log("Risk Level:", latest.riskLevel);
            console.log("Intent:", latest.intent);
            console.log("AI Response:", latest.aiResponse?.substring(0, 50) + "...");
            console.log("Created At:", latest.createdAt);
            console.log("-----------------------\n");
            console.log("✅ DB STORAGE VERIFIED.");
        } else {
            console.log("❌ No records found.");
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error("❌ Verification failed:", err.message);
    }
}

verify();

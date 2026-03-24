import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';
import CheckIn from '../models/CheckIn.js';
import Alert from '../models/Alert.js';
import CopingLog from '../models/CopingLog.js';

// ─── Connection ────────────────────────────────────────────
export const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('[DB] MONGODB_URI not set in .env. Skipping database connection.');
            return;
        }
        await mongoose.connect(uri);
        console.log('[DB] Connected to MongoDB Atlas ✅');
    } catch (err) {
        console.error('[DB] MongoDB connection failed:', err.message);
    }
};

// ─── User Operations ────────────────────────────────────────
export const upsertUser = async (userData) => {
    try {
        await User.findByIdAndUpdate(
            userData.uid,
            {
                email: userData.email,
                isAnonymous: userData.isAnonymous,
                lastActive: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    } catch (err) {
        console.error('[DB] Error upserting user:', err.message);
    }
};

export const getUserById = async (userId) => {
    try {
        return await User.findById(userId).lean();
    } catch (err) {
        console.error('[DB] Error fetching user:', err.message);
        return null;
    }
};

export const updateEmergencyContact = async (userId, name, phone) => {
    try {
        return await User.findByIdAndUpdate(
            userId,
            { emergencyContactName: name, emergencyContactPhone: phone },
            { new: true }
        ).lean();
    } catch (err) {
        console.error('[DB] Error updating contact:', err.message);
        throw err;
    }
};

export const getInactiveUsers = async (hoursInactive) => {
    try {
        const cutoff = new Date(Date.now() - hoursInactive * 60 * 60 * 1000);
        return await User.find({
            email: { $ne: null },
            lastActive: { $lt: cutoff }
        }).lean();
    } catch (err) {
        console.error('[DB] Error fetching inactive users:', err.message);
        return [];
    }
};

// ─── CheckIn Operations ─────────────────────────────────────
export const saveCheckIn = async (data) => {
    try {
        const doc = await CheckIn.create({
            userId: data.user_id,
            rawMessage: data.raw_message,
            journalWentWell: data.journal_went_well,
            journalDrained: data.journal_drained,
            sentimentScore: data.sentiment_score,
            intent: data.intent,
            riskLevel: data.risk_level,
            aiResponse: data.ai_response,
        });
        return doc.toObject();
    } catch (err) {
        console.error('[DB] Error saving check-in:', err.message);
        throw err;
    }
};

export const getRecentCheckIns = async (userId) => {
    try {
        return await CheckIn.find({ userId })
            .sort({ createdAt: -1 })
            .limit(7)
            .lean();
    } catch (err) {
        console.error('[DB] Error fetching check-ins:', err.message);
        return [];
    }
};

// ─── Coping Log Operations ──────────────────────────────────
export const saveCopingLog = async (userId, intent, strategy) => {
    try {
        return await CopingLog.create({ userId, intent, strategy });
    } catch (err) {
        console.error('[DB] Error saving coping log:', err.message);
        throw err;
    }
};

export const getCopingCount = async (userId) => {
    try {
        return await CopingLog.countDocuments({ userId });
    } catch (err) {
        console.error('[DB] Error fetching coping count:', err.message);
        return 0;
    }
};

// ─── Alert Operations ────────────────────────────────────────
export const saveAlert = async (userId, type, message) => {
    try {
        return await Alert.create({ userId, type, message });
    } catch (err) {
        console.error('[DB] Error saving alert:', err.message);
        throw err;
    }
};

export const getRecentAlerts = async (userId) => {
    try {
        return await Alert.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
    } catch (err) {
        console.error('[DB] Error fetching alerts:', err.message);
        return [];
    }
};

export const getAllActiveAlerts = async () => {
    try {
        return await Alert.find()
            .sort({ status: 1, createdAt: -1 }) // OPEN first
            .limit(100)
            .lean();
    } catch (err) {
        console.error('[DB] Error fetching all alerts:', err.message);
        return [];
    }
};

export const resolveAlert = async (alertId) => {
    try {
        return await Alert.findByIdAndUpdate(
            alertId,
            { status: 'RESOLVED' },
            { new: true }
        ).lean();
    } catch (err) {
        console.error('[DB] Error resolving alert:', err.message);
        throw err;
    }
};

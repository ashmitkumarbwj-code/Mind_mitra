import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,                 // Don't exhaust the 10-connection free tier limit
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
});

// Initialize Tables if they don't exist
const initializeTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                email VARCHAR(255),
                is_anonymous BOOLEAN DEFAULT false,
                emergency_contact_name VARCHAR(255),
                emergency_contact_phone VARCHAR(20),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS checkins (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255),
                raw_message TEXT,
                journal_went_well TEXT,
                journal_drained TEXT,
                sentiment_score FLOAT,
                intent VARCHAR(100),
                keywords JSONB,
                risk_level VARCHAR(20),
                ai_response TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS coping_logs (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255),
                intent VARCHAR(100),
                strategy TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS alerts (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255),
                type VARCHAR(50), -- 'RISK_RED', 'INACTIVITY_ESCALATION'
                message TEXT,
                status VARCHAR(20) DEFAULT 'OPEN',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_checkins_risk ON checkins(risk_level);
            CREATE INDEX IF NOT EXISTS idx_coping_user ON coping_logs(user_id);
        `);
        console.log("Database tables initialized successfully.");
    } catch (err) {
        console.error("Error initializing tables:", err.message);
    }
};

// Call once on startup
initializeTables();

export const saveCheckIn = async (checkinData) => {
    try {
        const query = `
            INSERT INTO checkins (user_id, raw_message, journal_went_well, journal_drained, sentiment_score, intent, keywords, risk_level, ai_response)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *;
        `;
        
        const values = [
            checkinData.user_id,
            checkinData.raw_message,
            checkinData.journal_went_well,
            checkinData.journal_drained,
            checkinData.sentiment_score,
            checkinData.intent,
            checkinData.keywords,
            checkinData.risk_level,
            checkinData.ai_response
        ];

        const res = await pool.query(query, values);
        return res.rows[0];
    } catch (err) {
        console.error('Error saving check-in to Postgres:', err.message);
        throw err;
    }
};

// Helper function to get past 7 days check-ins
export const getRecentCheckIns = async (userId) => {
    try {
        const query = `
            SELECT * FROM checkins
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 7;
        `;
        
        const res = await pool.query(query, [userId]);
        return res.rows;
    } catch (err) {
        console.error('Error fetching past check-ins from Postgres:', err.message);
        return [];
    }
};

export const upsertUser = async (userData) => {
    try {
        const query = `
            INSERT INTO users (id, email, is_anonymous, last_active)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (id) DO UPDATE 
            SET email = EXCLUDED.email,
                last_active = NOW();
        `;
        await pool.query(query, [userData.uid, userData.email, userData.isAnonymous]);
    } catch (err) {
        console.error('Error upserting user:', err.message);
    }
};

export const updateEmergencyContact = async (userId, name, phone) => {
    try {
        const query = `
            UPDATE users SET emergency_contact_name = $2, emergency_contact_phone = $3
            WHERE id = $1 RETURNING *;
        `;
        const res = await pool.query(query, [userId, name, phone]);
        return res.rows[0];
    } catch (err) {
        console.error('Error updating contact:', err.message);
        throw err;
    }
};

export const getCopingCount = async (userId) => {
    try {
        const query = `SELECT COUNT(*)::int FROM coping_logs WHERE user_id = $1;`;
        const res = await pool.query(query, [userId]);
        return res.rows[0].count;
    } catch (err) {
        console.error('Error fetching coping count:', err.message);
        return 0;
    }
};

export const getUserById = async (userId) => {
    try {
        const query = `SELECT * FROM users WHERE id = $1;`;
        const res = await pool.query(query, [userId]);
        return res.rows[0];
    } catch (err) {
        console.error('Error fetching user:', err.message);
        return null;
    }
};

export const saveCopingLog = async (userId, intent, strategy) => {
    try {
        const query = `
            INSERT INTO coping_logs (user_id, intent, strategy)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const res = await pool.query(query, [userId, intent, strategy]);
        return res.rows[0];
    } catch (err) {
        console.error('Error saving coping log:', err.message);
        throw err;
    }
};

export const getInactiveUsers = async (hoursInactive) => {
    try {
        const query = `
            SELECT id, email, emergency_contact_phone, last_active 
            FROM users 
            WHERE last_active < NOW() - INTERVAL '${hoursInactive} hours'
        `;
        const res = await pool.query(query);
        return res.rows;
    } catch (err) {
        console.error('Error fetching inactive users:', err.message);
        return [];
    }
};
export const saveAlert = async (userId, type, message) => {
    try {
        const query = `
            INSERT INTO alerts (user_id, type, message)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const res = await pool.query(query, [userId, type, message]);
        return res.rows[0];
    } catch (err) {
        console.error('Error saving alert:', err.message);
        throw err;
    }
};

export const getRecentAlerts = async (userId) => {
    try {
        const query = `
            SELECT * FROM alerts
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 5;
        `;
        const res = await pool.query(query, [userId]);
        return res.rows;
    } catch (err) {
        console.error('Error fetching alerts:', err.message);
        return [];
    }
};

export const getAllActiveAlerts = async () => {
    try {
        const query = `
            SELECT * FROM alerts
            ORDER BY 
                CASE WHEN status = 'OPEN' THEN 1 ELSE 2 END,
                created_at DESC
            LIMIT 100;
        `;
        const res = await pool.query(query);
        return res.rows;
    } catch (err) {
        console.error('Error fetching all active alerts:', err.message);
        return [];
    }
};

export const resolveAlert = async (alertId) => {
    try {
        const query = `
            UPDATE alerts 
            SET status = 'RESOLVED' 
            WHERE id = $1 
            RETURNING *;
        `;
        const res = await pool.query(query, [alertId]);
        return res.rows[0];
    } catch (err) {
        console.error('Error resolving alert:', err.message);
        throw err;
    }
};

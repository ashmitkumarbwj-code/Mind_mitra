import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
    connectionString,
    // Required for some external deployments, Supabase usually handles secure connections by default
    ssl: { rejectUnauthorized: false } 
});

// Initialize Tables if they don't exist
const initializeTables = async () => {
    try {
        await pool.query(`
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
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

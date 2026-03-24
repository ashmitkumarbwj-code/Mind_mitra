import { getRecentCheckIns } from '../services/dbService.js';

export const getUserDashboard = async (req, res) => {
    try {
        const userId = req.query.userId || 'anonymous';
        const checkins = await getRecentCheckIns(userId);
        
        // Aggregate Data for UI metrics
        // (If DB fails, we return mock default stats)
        let trends = checkins.map(c => ({
            date: c.created_at || new Date().toISOString(),
            score: c.sentiment_score
        })).reverse(); // Oldest to newest for plotting
        
        // Mock fallback if empty for prototype visual setup
        if (trends.length === 0) {
            trends = [
                { date: 'Mon', score: 0.1 },
                { date: 'Tue', score: 0.4 },
                { date: 'Wed', score: -0.2 },
                { date: 'Thu', score: 0.5 },
                { date: 'Fri', score: 0.8 }
            ];
        }

        const stats = {
            trends,
            topIntent: 'Stress', // Mock aggregation
            currentRiskStatus: checkins[0]?.risk_level || 'Green'
        };

        res.status(200).json({ data: stats });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to aggregate dashboard data.' });
    }
};

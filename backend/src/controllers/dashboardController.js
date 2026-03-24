import { getRecentCheckIns, getCopingCount, getUserById, getRecentAlerts } from '../services/dbService.js';

export const getUserDashboard = async (req, res) => {
    try {
        const userId = req.query.userId || 'anonymous';
        const checkins = await getRecentCheckIns(userId);
        const activitiesCount = await getCopingCount(userId);
        const user = await getUserById(userId);
        const alerts = await getRecentAlerts(userId);
        
        // Aggregate Data for UI metrics
        let trends = checkins.map(c => ({
            date: c.created_at || new Date().toISOString(),
            score: c.sentiment_score
        })).reverse();

        // Calculate Burnout score (Amber frequency)
        const amberCount = checkins.filter(c => c.risk_level === 'Amber').length;
        const totalRecent = checkins.length || 1;
        const burnoutScore = Math.min(100, Math.round((amberCount / totalRecent) * 100));
        
        const stats = {
            trends,
            topIntent: checkins[0]?.intent || 'Calm',
            currentRiskStatus: checkins[0]?.risk_level || 'Green',
            activitiesCompleted: activitiesCount,
            burnoutScore: burnoutScore,
            alerts: alerts,
            user: user
        };

        res.status(200).json({ data: stats });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to aggregate dashboard data.' });
    }
};

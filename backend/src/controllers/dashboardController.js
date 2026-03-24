import { getRecentCheckIns, getCopingCount, getUserById, getRecentAlerts } from '../services/dbService.js';

export const getUserDashboard = async (req, res) => {
    try {
        const userId = req.query.userId || 'anonymous';
        const checkins = await getRecentCheckIns(userId);
        const activitiesCount = await getCopingCount(userId);
        const user = await getUserById(userId);
        const alerts = await getRecentAlerts(userId);
        
        // MongoDB returns camelCase fields (createdAt, sentimentScore, riskLevel)
        let trends = checkins.map(c => ({
            date: c.createdAt || new Date().toISOString(),
            score: c.sentimentScore
        })).reverse();

        // Calculate Burnout score (Amber frequency)
        const amberCount = checkins.filter(c => c.riskLevel === 'Amber').length;
        const totalRecent = checkins.length || 1;
        const burnoutScore = Math.min(100, Math.round((amberCount / totalRecent) * 100));
        
        const stats = {
            trends,
            topIntent: checkins[0]?.intent || 'Calm',
            currentRiskStatus: checkins[0]?.riskLevel || 'Green',
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

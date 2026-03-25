import { getAllActiveAlerts, resolveAlert, getGlobalStats } from '../services/dbService.js';

export const getAlerts = async (req, res) => {
    try {
        const alerts = await getAllActiveAlerts();
        
        // Map fields to match frontend expectations (snake_case)
        const mappedAlerts = alerts.map(alert => ({
            id: alert._id,
            user_id: alert.userId,
            type: alert.type,
            message: alert.message,
            status: alert.status,
            created_at: alert.createdAt
        }));

        res.status(200).json({ data: mappedAlerts });
    } catch (error) {
        console.error('Error fetching admin alerts:', error);
        res.status(500).json({ error: 'Failed to fetch campus alerts' });
    }
};

export const getAdminStats = async (req, res) => {
    try {
        const stats = await getGlobalStats();
        res.status(200).json({ data: stats });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch global stats' });
    }
};

export const resolveAlertStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedAlert = await resolveAlert(id);
        
        if (!updatedAlert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        res.status(200).json({ message: 'Alert resolved successfully', data: updatedAlert });
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ error: 'Failed to resolve alert' });
    }
};

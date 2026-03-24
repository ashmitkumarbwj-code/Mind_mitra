import { getAllActiveAlerts, resolveAlert } from '../services/dbService.js';

export const getAlerts = async (req, res) => {
    try {
        const alerts = await getAllActiveAlerts();
        res.status(200).json({ data: alerts });
    } catch (error) {
        console.error('Error fetching admin alerts:', error);
        res.status(500).json({ error: 'Failed to fetch campus alerts' });
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

import express from 'express';
import mongoose from 'mongoose';
import { submitCheckIn, getHistory, updateContact, logCopingAction } from '../controllers/checkinController.js';

const router = express.Router();

router.get('/health', async (req, res) => {
    const isConnected = mongoose.connection.readyState === 1;
    res.json({
        status: isConnected ? 'Healthy' : 'Disconnected',
        database: mongoose.connection.name || 'Unknown',
        timestamp: new Date().toISOString()
    });
});

router.post('/submit', submitCheckIn);
router.post('/', submitCheckIn); // Map /api/v1/checkin/ to submitCheckIn
router.post('/action/coping', logCopingAction);
router.get('/history', getHistory);
router.put('/emergency-contact', updateContact);

export default router;

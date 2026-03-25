import express from 'express';
import { getAlerts, resolveAlertStatus, getAdminStats } from '../controllers/adminController.js';

const router = express.Router();

router.get('/alerts', getAlerts);
router.get('/stats', getAdminStats);
router.put('/alerts/:id/resolve', resolveAlertStatus);

export default router;

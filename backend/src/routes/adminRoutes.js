import express from 'express';
import { getAlerts, resolveAlertStatus } from '../controllers/adminController.js';

const router = express.Router();

router.get('/alerts', getAlerts);
router.put('/alerts/:id/resolve', resolveAlertStatus);

export default router;

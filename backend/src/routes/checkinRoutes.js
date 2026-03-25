import express from 'express';
import { submitCheckIn, getHistory, updateContact, logCopingAction } from '../controllers/checkinController.js';

const router = express.Router();

router.post('/submit', submitCheckIn);
router.post('/', submitCheckIn); // Map /api/v1/checkin/ to submitCheckIn
router.post('/action/coping', logCopingAction);
router.get('/history', getHistory);
router.put('/emergency-contact', updateContact);

export default router;

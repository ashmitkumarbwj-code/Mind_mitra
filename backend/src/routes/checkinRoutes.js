import express from 'express';
import { submitCheckIn, getHistory } from '../controllers/checkinController.js';

const router = express.Router();

router.post('/submit', submitCheckIn);
router.get('/history', getHistory);

export default router;

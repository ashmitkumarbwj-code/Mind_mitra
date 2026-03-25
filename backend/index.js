import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import checkinRoutes from './src/routes/checkinRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import { initCronJobs } from './src/services/cronService.js';
import { connectDB } from './src/services/dbService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/v1/checkin', checkinRoutes);
app.use('/api/checkin', checkinRoutes); // Direct mapping for user's Dashboard.jsx
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/admin', adminRoutes);

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'MindMitra Backend is Live!' });
});

// Silence Chrome DevTools internal probe
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(200).json({});
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Mental Health Check-In API is running' });
});

// Connect to MongoDB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    initCronJobs();
  });
});

export default app;

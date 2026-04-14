import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth';
import carsRoutes from './routes/cars';
import bookingsRoutes from './routes/bookings';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { message: 'Too many login attempts, please try again after 15 minutes' }
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/bookings', bookingsRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

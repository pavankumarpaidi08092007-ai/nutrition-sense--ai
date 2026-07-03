import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB, isUsingMockDB } from './config/db';
// Route imports
import authRoutes from './routes/authRoutes';
import foodRoutes from './routes/foodRoutes';
import trackerRoutes from './routes/trackerRoutes';
import recommendationRoutes from './routes/recommendationRoutes';
import adminRoutes from './routes/adminRoutes';
import chatRoutes from './routes/chatRoutes';
import notificationRoutes from './routes/notificationRoutes';

// Initialize configuration
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // For development, allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting to prevent denial of service
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  message: 'Too many requests from this IP. Please try again after 15 minutes.'
});
app.use('/api/', limiter);

// Request parsing
app.use(express.json());

// Base Route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Nutri Sense API',
    status: 'online',
    version: '1.0.0',
    database: isUsingMockDB ? 'MOCK_DATABASE' : 'MONGODB_ATLAS'
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/trackers', trackerRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Connect DB & Start Server
const startServer = async () => {
  await connectDB();
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`[NUTRI SENSE SERVER] running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });
  }
};

startServer();

export default app;

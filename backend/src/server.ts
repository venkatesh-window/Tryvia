import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import walletRoutes from './routes/walletRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const API_PREFIX = '/api/v1';

// Middlewares
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/wallet`, walletRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);

// Health Check
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the TRYVIA MERN API',
    status: 'online',
    version: '1.0.0',
  });
});

// Centralized Error Handling
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 TryVia Express Server running at http://localhost:${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
});

export default app;

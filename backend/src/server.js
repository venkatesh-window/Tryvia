import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { validateEnv } from "./config/env.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import payoutRoutes from "./routes/payoutRoutes.js";
import returnRoutes from "./routes/returnRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();
validateEnv();

const app = express();
const PORT = process.env.PORT || 8000;
const API_PREFIX = "/api/v1";

// Middlewares
app.use(helmet());

// Apply a general rate limit to all requests
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// Specific stricter limit for Auth/Admin routes will be applied in routes.

app.use(
  cors({
    origin: (origin, callback) => {
      // In production, restrict this to specific origins (e.g. process.env.FRONTEND_URL)
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
      ];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Fallback for development/testing when origins might vary
        if (process.env.NODE_ENV !== "production") {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

import { setup } from "./test_setup.js";
import { seed } from "./seed.js";

import { User } from "./models/User.js";

// Connect to MongoDB
connectDB()
  .then(async () => {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("Database is empty. Running initial seed and setup...");
      await seed();
      await setup();
    } else {
      console.log(
        `Database already has data (${userCount} users). Skipping initial seed.`,
      );
      // Still run setup to ensure test users exist (setup uses upsert, which is safe)
      await setup();
    }
  })
  .catch((err) => {
    console.error("❌ Fatal Database Initialization Error:", err);
    process.exit(1);
  });

// API Routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/wallet`, walletRoutes);
app.use(`${API_PREFIX}/vendor`, vendorRoutes);
app.use(`${API_PREFIX}/payouts`, payoutRoutes);
app.use(`${API_PREFIX}/returns`, returnRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the TRYVIA MERN API",
    status: "online",
    version: "1.0.0",
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

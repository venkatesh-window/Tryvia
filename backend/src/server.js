import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const API_PREFIX = "/api/v1";

// Middlewares
app.use(
  cors({
    origin: ["http://localhost:8081", "http://localhost:8082"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

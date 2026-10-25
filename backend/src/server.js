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
import { nosqlSanitize } from "./middleware/nosqlSanitize.js";
import { setup } from "./test_setup.js";
import { seed } from "./seed.js";
import { User } from "./models/User.js";

dotenv.config();
validateEnv();

const app = express();
const PORT = process.env.PORT || 8000;
const API_PREFIX = "/api/v1";

// Trust first proxy hop (e.g. AWS ALB, Cloudflare, Vercel, Render) for accurate client IPs in rate limiters
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Production HTTPS enforcement
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (
      req.headers["x-forwarded-proto"] &&
      req.headers["x-forwarded-proto"] !== "https"
    ) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Security headers with tailored CSP for Razorpay checkout, 3DS banking OTP iframes, & image CDNs
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://checkout.razorpay.com",
          "https://cdn.razorpay.com",
        ],
        frameSrc: [
          "'self'",
          "https:",
          "data:",
          "blob:",
        ],
        connectSrc: [
          "'self'",
          "https:",
          "wss:",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://images.unsplash.com",
          "https://res.cloudinary.com",
          "https://cdn.razorpay.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

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

const explicitAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://localhost:8081",
];

if (process.env.FRONTEND_URL) {
  explicitAllowedOrigins.push(
    ...process.env.FRONTEND_URL.split(",").map((url) => url.trim()),
  );
}

if (process.env.ALLOWED_ORIGINS) {
  explicitAllowedOrigins.push(
    ...process.env.ALLOWED_ORIGINS.split(",").map((url) => url.trim()),
  );
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser agents (native mobile apps, backend callers) without origin header
      if (!origin) {
        return callback(null, true);
      }

      // Strict exact match against allowlist
      if (explicitAllowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS policy violation: origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "x-razorpay-signature"],
  }),
);

app.use(
  express.json({
    limit: "2mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(nosqlSanitize);

// Connect to MongoDB
connectDB()
  .then(async () => {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      if (process.env.NODE_ENV !== "production") {
        console.log("Database is empty. Running initial development seed...");
        await seed();
        if (process.env.ENABLE_DEV_TEST_USERS === "true") {
          await setup();
        }
      } else {
        console.log("Database connected in production mode.");
      }
    } else {
      console.log(
        `Database already has data (${userCount} users). Skipping initial seed.`,
      );
      if (process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_TEST_USERS === "true") {
        await setup();
      }
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

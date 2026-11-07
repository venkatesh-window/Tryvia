import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
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

// Gzip & Brotli HTTP response compression (saves bandwidth, reduces socket memory)
app.use(
  compression({
    threshold: 1024,
  }),
);

// Load shedding: prevent server from crashing when RAM is close to exhaustion
app.use((req, res, next) => {
  const mem = process.memoryUsage();
  const heapUsageRatio = mem.heapUsed / mem.heapTotal;
  // If memory is critically high (>92%) and request is non-essential read, shed load safely
  if (heapUsageRatio > 0.92 && req.method === "GET" && req.path !== "/" && !req.path.startsWith("/api/v1/payments")) {
    res.setHeader("Retry-After", "2");
    return res.status(503).json({
      detail: "Server is experiencing high traffic. Please retry in a moment.",
    });
  }
  next();
});

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

const isOriginAllowed = (origin) => {
  // Allow non-browser agents (native mobile apps, backend callers, curl) without origin header
  if (!origin) return true;

  // Exact match against explicit allowlist
  if (explicitAllowedOrigins.includes(origin)) return true;

  // Localhost / Loopback with any port (Vite on 5173/5174/5175, Next.js, preview ports, etc.)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;

  // Local private LAN IPs with any port (for mobile/Expo testing on the same Wi-Fi)
  if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) return true;

  // All Vercel deployments (production domain, branch previews, e.g. *.vercel.app)
  if (/^https:\/\/([a-zA-Z0-9_-]+\.)*vercel\.app$/.test(origin)) return true;

  // All Render deployments (*.onrender.com)
  if (/^https:\/\/([a-zA-Z0-9_-]+\.)*onrender\.com$/.test(origin)) return true;

  // Tryvia custom domains (*.tryvia.in, *.tryvia.com)
  if (/^https:\/\/([a-zA-Z0-9_-]+\.)*tryvia\.(in|com)$/.test(origin)) return true;

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-razorpay-signature",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
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

// Global process-level safety nets to prevent unhandled rejections from terminating the process
process.on("unhandledRejection", (reason, promise) => {
  console.error("⚠️ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🚀 TryVia Express Server running at http://localhost:${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
});

// Graceful Shutdown on SIGTERM / SIGINT
const handleGracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Closing server gracefully...`);
  server.close(async () => {
    console.log("🔒 HTTP server closed.");
    try {
      const { closeDB } = await import("./config/db.js");
      await closeDB();
      console.log("🔌 Database connections closed cleanly.");
    } catch (e) {
      console.error("Error closing database during shutdown:", e);
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error("⚠️ Forceful shutdown after 10s timeout.");
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", () => handleGracefulShutdown("SIGTERM"));
process.on("SIGINT", () => handleGracefulShutdown("SIGINT"));

export default app;

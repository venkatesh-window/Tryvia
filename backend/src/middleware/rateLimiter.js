import rateLimit from "express-rate-limit";

// Stricter rate limit for authentication (login/register)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for auth routes
  message: "Too many login attempts from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for admin routes
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many admin attempts from this IP, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

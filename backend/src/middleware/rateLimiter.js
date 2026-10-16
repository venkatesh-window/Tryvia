import rateLimit from "express-rate-limit";

const defaultHandler = (req, res, next, options) => {
  const retrySecs = Math.ceil(options.windowMs / 1000);
  res.setHeader("Retry-After", retrySecs);
  res.status(options.statusCode).json({
    detail: typeof options.message === "string" ? options.message : "Too many requests. Please try again later.",
    retry_after: retrySecs,
  });
};

const userOrIpKey = (req) => {
  if (req.user && req.user._id) {
    return `user_${req.user._id}`;
  }
  return req.ip || req.headers["x-forwarded-for"] || "unknown";
};

// Stricter rate limit for authentication (login/register/sync)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: defaultHandler,
});

// Stricter rate limit for admin routes
export const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many admin attempts from this IP. Please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: defaultHandler,
});

// Sensitive financial endpoint limiter (payment order creation & verification)
export const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  keyGenerator: userOrIpKey,
  validate: { keyGeneratorIpFallback: false },
  message: "Payment transaction rate limit exceeded. Please wait before creating new payment orders.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: defaultHandler,
});

// Strict rate limit for payout withdrawals
export const payoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: userOrIpKey,
  validate: { keyGeneratorIpFallback: false },
  message: "Payout request rate limit exceeded. Only 5 requests allowed per 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: defaultHandler,
});



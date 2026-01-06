const rateLimit = require("express-rate-limit");

/**
 * Rate limiter for OTP requests (signup, resend)
 * Max 3 requests per 10 minutes per IP
 */
const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Max 3 requests
  message:
    "Too many OTP requests. Please try again later (max 3 per 10 minutes).",
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => process.env.NODE_ENV === "test", // Skip rate limiting in test env
});

/**
 * Rate limiter for OTP verification attempts
 * Max 5 verification attempts per 15 minutes per email
 */
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 verification attempts
  keyGenerator: (req) => req.body.email || req.ip, // Use email as key
  message:
    "Too many OTP verification attempts. Please try again later (max 5 per 15 minutes).",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
});

/**
 * Rate limiter for login attempts
 * Max 20 login attempts per 15 minutes per IP (increased for development)
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 5 : 20, // 5 in production, 20 in development
  message:
    "Too many login attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "test",
});

module.exports = {
  otpRequestLimiter,
  otpVerifyLimiter,
  loginLimiter,
};

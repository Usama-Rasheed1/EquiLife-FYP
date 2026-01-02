const express = require("express");
const otpRouter = express.Router();
const otpController = require("../controllers/otpController");
const {
  otpRequestLimiter,
  otpVerifyLimiter,
} = require("../middleware/rateLimiters");

/**
 * POST /auth/register
 * Register user and send OTP
 * Rate limited: 3 requests per 10 minutes
 */
otpRouter.post("/register", otpRequestLimiter, otpController.register);

/**
 * POST /auth/verify-email-otp
 * Verify OTP and complete registration
 * Rate limited: 5 verification attempts per 15 minutes
 */
otpRouter.post(
  "/verify-email-otp",
  otpVerifyLimiter,
  otpController.verifyEmailOTP
);

/**
 * POST /auth/resend-email-otp
 * Resend OTP to email
 * Rate limited: 3 requests per 10 minutes
 */
otpRouter.post(
  "/resend-email-otp",
  otpRequestLimiter,
  otpController.resendEmailOTP
);

module.exports = otpRouter;

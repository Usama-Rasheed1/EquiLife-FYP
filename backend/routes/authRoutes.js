const express = require('express');
const authRouter = express.Router();
const { login, updateProfile, getProfile, saveFitnessCalculations, changePassword } = require('../controllers/authController');
const otpController = require('../controllers/otpController');
const verifyToken = require('../middleware/authMiddleware');
const { otpRequestLimiter, otpVerifyLimiter, loginLimiter } = require('../middleware/rateLimiters');

// OTP-based registration endpoints
authRouter.post('/register', otpRequestLimiter, otpController.register);
authRouter.post('/verify-email-otp', otpVerifyLimiter, otpController.verifyEmailOTP);
authRouter.post('/resend-email-otp', otpRequestLimiter, otpController.resendEmailOTP);
// Password reset via OTP
authRouter.post('/request-password-reset', otpRequestLimiter, otpController.requestPasswordReset);
authRouter.post('/verify-reset-otp', otpVerifyLimiter, otpController.verifyPasswordResetOTP);
authRouter.post('/reset-password', otpVerifyLimiter, otpController.resetPasswordWithOTP);

// Login (rate limited)
authRouter.post('/login', loginLimiter, login);

// Protected routes (require JWT token with verified email)
authRouter.get('/profile', verifyToken, getProfile);
authRouter.put('/profile', verifyToken, updateProfile);
authRouter.post('/change-password', verifyToken, changePassword);
authRouter.post('/fitness-calculations', verifyToken, saveFitnessCalculations);

module.exports = authRouter;

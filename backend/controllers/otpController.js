const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcryptjs");
const { generateAccessToken } = require("../utils/token");
const { sendOTPEmail } = require("../utils/emailService");
const {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiryTime,
} = require("../utils/otpHelpers");
const notificationService = require("../services/notificationService");

/**
 * Register user and send OTP
 * POST /auth/register
 *
 * Request:
 * {
 *   fullName: string,
 *   email: string,
 *   password: string
 * }
 *
 * Response:
 * {
 *   ok: true,
 *   message: "User registered. OTP sent to email.",
 *   user: { _id, email, fullName, isVerified }
 * }
 */
exports.register = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.isVerified) {
        // User exists but not verified; resend OTP
        return res.status(409).json({
          ok: false,
          message:
            "Email already registered but not verified. Please check your email for OTP.",
        });
      }
      return res.status(400).json({
        ok: false,
        message: "Email already registered and verified.",
      });
    }

    // Create user (password hashed by model pre-save hook)
    const user = await User.create({
      fullName,
      email,
      password,
      isVerified: false, // Not verified until OTP is verified
    });

    // Generate OTP
    const otpCode = generateOTP();
    const otpHash = hashOTP(otpCode);
    const expiresAt = getOTPExpiryTime();

    // Save OTP record
    const otpRecord = await OTP.create({
      userId: user._id,
      email,
      otpHash,
      expiresAt,
      attempts: 0,
      resendCount: 0,
    });

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otpCode);
    if (!emailSent) {
      console.warn(`[OTP] Email sending failed for ${email}, but OTP saved.`);
    }

    // Create initial notifications (non-blocking)
    notificationService.createInitialNotifications(user._id).catch((err) => {
      console.error("[Notification] Init error:", err);
    });

    return res.status(201).json({
      ok: true,
      message: "User registered. OTP sent to email.",
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Error registering user" });
  }
};

/**
 * Verify OTP and complete registration
 * POST /auth/verify-email-otp
 *
 * Request:
 * {
 *   email: string,
 *   otp: string
 * }
 *
 * Response:
 * {
 *   ok: true,
 *   message: "Email verified successfully",
 *   accessToken: string,
 *   user: { _id, email, fullName, isVerified }
 * }
 */
exports.verifyEmailOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Validate input
    if (!email || !otp) {
      return res
        .status(400)
        .json({ ok: false, message: "Email and OTP are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        ok: false,
        message: "Email already verified. Please login.",
      });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ userId: user._id, email });
    if (!otpRecord) {
      return res.status(400).json({
        ok: false,
        message: "OTP not found or expired",
      });
    }

    // Check OTP expiry
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({
        ok: false,
        message: "OTP has expired. Request a new one.",
      });
    }

    // Check max verification attempts
    if (otpRecord.attempts >= 5) {
      return res.status(429).json({
        ok: false,
        message: "Maximum verification attempts exceeded. Request new OTP.",
      });
    }

    // Verify OTP
    try {
      const isValid = verifyOTP(otp, otpRecord.otpHash);
      if (!isValid) {
        // Increment attempts on failure
        otpRecord.attempts += 1;
        await otpRecord.save();
        return res.status(400).json({
          ok: false,
          message:
            otpRecord.attempts < 5
              ? `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`
              : "Maximum attempts exceeded. Request new OTP.",
        });
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      return res.status(400).json({
        ok: false,
        message: "Invalid OTP",
      });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate JWT
    const accessToken = generateAccessToken(user._id);

    return res.json({
      ok: true,
      message: "Email verified successfully",
      accessToken,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res
      .status(500)
      .json({ ok: false, message: "Error verifying OTP" });
  }
};

/**
 * Resend OTP
 * POST /auth/resend-email-otp
 *
 * Request:
 * {
 *   email: string
 * }
 *
 * Response:
 * {
 *   ok: true,
 *   message: "OTP resent to email"
 * }
 */
exports.resendEmailOTP = async (req, res) => {
  const { email } = req.body;

  try {
    // Validate input
    if (!email) {
      return res.status(400).json({
        ok: false,
        message: "Email is required",
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal whether email exists (security best practice)
      return res.json({
        ok: true,
        message: "If email exists, new OTP sent.",
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        ok: false,
        message: "Email already verified. Please login.",
      });
    }

    // Find existing OTP record
    let otpRecord = await OTP.findOne({ userId: user._id, email });

    if (otpRecord) {
      // Check resend count
      if (otpRecord.resendCount >= 3) {
        return res.status(429).json({
          ok: false,
          message: "Maximum resend attempts exceeded. Please try again later.",
        });
      }

      // Generate new OTP
      const otpCode = generateOTP();
      otpRecord.otpHash = hashOTP(otpCode);
      otpRecord.expiresAt = getOTPExpiryTime();
      otpRecord.attempts = 0; // Reset attempts on resend
      otpRecord.resendCount += 1;
      await otpRecord.save();

      // Send email
      const emailSent = await sendOTPEmail(email, otpCode);
      if (!emailSent) {
        console.warn(`[OTP] Email sending failed for resend to ${email}`);
      }
    } else {
      // Create new OTP record (shouldn't happen in normal flow)
      const otpCode = generateOTP();
      otpRecord = await OTP.create({
        userId: user._id,
        email,
        otpHash: hashOTP(otpCode),
        expiresAt: getOTPExpiryTime(),
        attempts: 0,
        resendCount: 1,
      });

      const emailSent = await sendOTPEmail(email, otpCode);
      if (!emailSent) {
        console.warn(`[OTP] Email sending failed for ${email}`);
      }
    }

    return res.json({
      ok: true,
      message: "OTP resent to email",
    });
  } catch (err) {
    console.error("Resend OTP error:", err);
    return res.status(500).json({
      ok: false,
      message: "Error resending OTP",
    });
  }
};

/**
 * Request password-reset OTP
 * POST /auth/request-password-reset
 */
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ ok: false, message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ ok: true, message: 'If email exists, a reset OTP was sent.' });
    }

    let otpRecord = await OTP.findOne({ userId: user._id, email });
    const otpCode = generateOTP();
    const otpHash = hashOTP(otpCode);
    const expiresAt = getOTPExpiryTime();

    if (otpRecord) {
      if ((otpRecord.resendCount || 0) >= 3) {
        return res.status(429).json({ ok: false, message: 'Maximum resend attempts exceeded. Please try again later.' });
      }
      otpRecord.otpHash = otpHash;
      otpRecord.expiresAt = expiresAt;
      otpRecord.attempts = 0;
      otpRecord.resendCount = (otpRecord.resendCount || 0) + 1;
      await otpRecord.save();
    } else {
      otpRecord = await OTP.create({ userId: user._id, email, otpHash, expiresAt, attempts: 0, resendCount: 1 });
    }

    const emailSent = await sendOTPEmail(email, otpCode);
    if (!emailSent) console.warn(`[OTP] Password reset email sending failed for ${email}`);

    return res.json({ ok: true, message: 'If email exists, a reset OTP was sent.' });
  } catch (err) {
    console.error('Request password reset error:', err);
    return res.status(500).json({ ok: false, message: 'Error requesting password reset' });
  }
};

/**
 * Verify password-reset OTP without changing password
 * POST /auth/verify-reset-otp
 */
exports.verifyPasswordResetOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) return res.status(400).json({ ok: false, message: 'Email and OTP are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ ok: false, message: 'Invalid request' });

    const otpRecord = await OTP.findOne({ userId: user._id, email });
    if (!otpRecord) return res.status(400).json({ ok: false, message: 'OTP not found or expired' });

    if (new Date() > otpRecord.expiresAt) return res.status(400).json({ ok: false, message: 'OTP has expired. Request a new one.' });
    if (otpRecord.attempts >= 5) return res.status(429).json({ ok: false, message: 'Maximum verification attempts exceeded. Request new OTP.' });

    let isValid;
    try { isValid = verifyOTP(otp, otpRecord.otpHash); } catch (err) { console.error('OTP verification error:', err); return res.status(400).json({ ok: false, message: 'Invalid OTP' }); }

    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ ok: false, message: otpRecord.attempts < 5 ? `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.` : 'Maximum attempts exceeded. Request new OTP.' });
    }

    return res.json({ ok: true, message: 'OTP verified' });
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    return res.status(500).json({ ok: false, message: 'Error verifying OTP' });
  }
};

/**
 * Reset password using OTP
 * POST /auth/reset-password
 */
exports.resetPasswordWithOTP = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    if (!email || !otp || !newPassword) return res.status(400).json({ ok: false, message: 'Email, OTP and new password are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ ok: false, message: 'Invalid request' });

    const otpRecord = await OTP.findOne({ userId: user._id, email });
    if (!otpRecord) return res.status(400).json({ ok: false, message: 'OTP not found or expired' });

    if (new Date() > otpRecord.expiresAt) return res.status(400).json({ ok: false, message: 'OTP has expired. Request a new one.' });
    if (otpRecord.attempts >= 5) return res.status(429).json({ ok: false, message: 'Maximum verification attempts exceeded. Request new OTP.' });

    let isValid;
    try { isValid = verifyOTP(otp, otpRecord.otpHash); } catch (err) { console.error('OTP verification error:', err); return res.status(400).json({ ok: false, message: 'Invalid OTP' }); }

    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ ok: false, message: otpRecord.attempts < 5 ? `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.` : 'Maximum attempts exceeded. Request new OTP.' });
    }

    // Set new password (pre-save hook hashes it)
    user.password = newPassword;
    await user.save();

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    return res.json({ ok: true, message: 'Password reset successfully. Please login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ ok: false, message: 'Error resetting password' });
  }
};

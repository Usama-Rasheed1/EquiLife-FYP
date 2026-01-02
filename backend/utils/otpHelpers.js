const crypto = require("crypto");

/**
 * Generate a 6-digit numeric OTP
 * @returns {string} 6-digit OTP code
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Hash OTP using SHA256
 * @param {string} otp - Plain OTP code
 * @returns {string} Hashed OTP
 */
const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

/**
 * Verify OTP by comparing plain and hashed versions
 * @param {string} plainOTP - User-provided OTP
 * @param {string} hashedOTP - Stored hashed OTP
 * @returns {boolean} True if OTP matches
 */
const verifyOTP = (plainOTP, hashedOTP) => {
  const hash = crypto.createHash("sha256").update(plainOTP).digest("hex");
  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hashedOTP)
  );
};

/**
 * Calculate OTP expiry time (5 minutes from now)
 * @returns {Date} Expiry timestamp
 */
const getOTPExpiryTime = () => {
  return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiryTime,
};

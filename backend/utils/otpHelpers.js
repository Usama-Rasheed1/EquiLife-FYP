const crypto = require("crypto");


const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const verifyOTP = (plainOTP, hashedOTP) => {
  const hash = crypto.createHash("sha256").update(plainOTP).digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(hashedOTP)
  );
};

const getOTPExpiryTime = () => {
  return new Date(Date.now() + 5 * 60 * 1000);
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiryTime,
};

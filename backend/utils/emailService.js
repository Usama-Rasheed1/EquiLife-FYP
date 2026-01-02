const nodemailer = require("nodemailer");

/**
 * Initialize Nodemailer transporter
 * Uses SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS from .env
 * Falls back to console logging if SMTP not configured
 */
const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT) {
    console.warn(
      "[EMAIL] SMTP not configured. Email sending will log to console only."
    );
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: parseInt(SMTP_PORT, 10) === 465, // Use TLS for 465, STARTTLS for 587
    auth: SMTP_USER
      ? {
          user: SMTP_USER,
          pass: SMTP_PASS,
        }
      : undefined,
  });
};

/**
 * Generate OTP email HTML template
 * @param {string} otp - 6-digit OTP code
 * @returns {string} HTML email template
 */
const generateOTPTemplate = (otp) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #333; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { text-align: center; }
        .otp-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 4px; }
        .expiry { color: #666; font-size: 14px; margin-top: 20px; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>EquiLife Email Verification</h1>
        </div>
        <div class="content">
          <p>Thank you for signing up! Please verify your email address using the code below:</p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
          </div>
          <p>This code will expire in <strong>5 minutes</strong>.</p>
          <p class="expiry">If you did not request this code, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; 2026 EquiLife. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send OTP email to user
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<boolean>} Success status
 */
const sendOTPEmail = async (to, otp) => {
  const transporter = getTransporter();

  if (!transporter) {
    // Fallback: log to console if SMTP not configured
    console.log(
      `[EMAIL FALLBACK] OTP for ${to}: ${otp} (expires in 5 minutes)`
    );
    return true;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"EquiLife" <${process.env.SMTP_USER}>`,
      to,
      subject: "EquiLife: Email Verification Code",
      html: generateOTPTemplate(otp),
    });
    return true;
  } catch (err) {
    console.error("[EMAIL ERROR] Failed to send OTP email:", err);
    return false;
  }
};

module.exports = { sendOTPEmail };

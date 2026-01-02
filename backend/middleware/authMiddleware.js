const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token and check email verification status
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ ok: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    req.user = { id: decoded.id };

    // Optional: Check if user still exists and is verified
    const user = await User.findById(decoded.id).select('isVerified');
    if (!user) {
      return res.status(401).json({ ok: false, message: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        ok: false, 
        message: 'Email not verified. Please verify your email first.' 
      });
    }

    return next();
  } catch (err) {
    return res.status(403).json({ ok: false, message: 'Invalid or expired token.' });
  }
};

module.exports = verifyToken;

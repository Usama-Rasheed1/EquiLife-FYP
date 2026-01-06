const User = require('../models/User');

// Middleware to check if user is a super admin
const requireSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: 'Unauthorized. Please sign in.' });
    }

    const user = await User.findById(userId).select('role');
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    if (user.role !== 'super admin') {
      return res.status(403).json({ ok: false, message: 'Access denied. Super admin privileges required.' });
    }

    next();
  } catch (err) {
    console.error('Role check error:', err);
    return res.status(500).json({ ok: false, message: 'Error verifying permissions' });
  }
};

// Middleware to check if user is admin or super admin
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: 'Unauthorized. Please sign in.' });
    }

    const user = await User.findById(userId).select('role');
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    if (user.role !== 'admin' && user.role !== 'super admin') {
      return res.status(403).json({ ok: false, message: 'Access denied. Admin privileges required.' });
    }

    next();
  } catch (err) {
    console.error('Role check error:', err);
    return res.status(500).json({ ok: false, message: 'Error verifying permissions' });
  }
};

module.exports = { requireSuperAdmin, requireAdmin };
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const { requireSuperAdmin, requireAdmin } = require('../middleware/roleMiddleware');
const Message = require('../models/Message');
const User = require('../models/User');

// Get all reported messages (sorted by abuseCount DESC)
router.get('/community/reported-messages', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({ abuseCount: { $gt: 0 } })
      .populate('sender', 'fullName email phone')
      .sort({ abuseCount: -1 });
    
    return res.json(messages);
  } catch (err) {
    console.error('get reported messages error', err);
    return res.status(500).json({ ok: false, message: 'Error fetching reported messages' });
  }
});

// Delete a message by ID (admin only)
router.delete('/community/message/:messageId', verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!messageId || !messageId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ ok: false, message: 'Invalid messageId' });
    }

    const message = await Message.findByIdAndDelete(messageId);
    if (!message) {
      return res.status(404).json({ ok: false, message: 'Message not found' });
    }

    return res.json({ ok: true, message: 'Message deleted successfully' });
  } catch (err) {
    console.error('delete message error', err);
    return res.status(500).json({ ok: false, message: 'Error deleting message' });
  }
});

// Get all users (role: user only) - for both admin and superadmin
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    console.error('get users error', err);
    return res.status(500).json({ ok: false, message: 'Error fetching users' });
  }
});

// Get all admin users (super admin only)
router.get('/admin-users', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 });
    return res.json(admins);
  } catch (err) {
    console.error('get admin users error', err);
    return res.status(500).json({ ok: false, message: 'Error fetching admin users' });
  }
});

// Create a new admin user (super admin only)
router.post('/admin-user', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({ ok: false, message: 'Full name, email, and password are required' });
    }

    if (password.length < 5) {
      return res.status(400).json({ ok: false, message: 'Password must be at least 5 characters' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ ok: false, message: 'Email already exists' });
    }

    // Create new admin user
    const admin = await User.create({
      fullName,
      email,
      password,
      role: 'admin',
      isVerified: true
    });

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    return res.status(201).json({ ok: true, message: 'Admin user created successfully', admin: adminResponse });
  } catch (err) {
    console.error('create admin user error', err);
    return res.status(500).json({ ok: false, message: 'Error creating admin user' });
  }
});

// Delete an admin user (super admin only)
router.delete('/admin-user/:userId', verifyToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ ok: false, message: 'Invalid userId' });
    }

    // Check if trying to delete a super admin
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Admin user not found' });
    }

    if (user.role === 'super admin') {
      return res.status(403).json({ ok: false, message: 'Cannot delete super admin users' });
    }

    if (user.role !== 'admin') {
      return res.status(400).json({ ok: false, message: 'User is not an admin' });
    }

    await User.findByIdAndDelete(userId);
    return res.json({ ok: true, message: 'Admin user deleted successfully' });
  } catch (err) {
    console.error('delete admin user error', err);
    return res.status(500).json({ ok: false, message: 'Error deleting admin user' });
  }
});

// Verify a user by ID (set isVerified to true)
router.patch('/verify-user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ ok: false, message: 'Invalid userId' });
    }

    const user = await User.findByIdAndUpdate(userId, { isVerified: true }, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    return res.json({ ok: true, message: 'User verified successfully', user });
  } catch (err) {
    console.error('verify user error', err);
    return res.status(500).json({ ok: false, message: 'Error verifying user' });
  }
});

// Delete a user by ID
router.delete('/user/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || !userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ ok: false, message: 'Invalid userId' });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    return res.json({ ok: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('delete user error', err);
    return res.status(500).json({ ok: false, message: 'Error deleting user' });
  }
});

module.exports = router;

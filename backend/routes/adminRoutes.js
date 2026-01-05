const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
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

// Get all users (role: user only)
router.get('/users', verifyToken, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    return res.json(users);
  } catch (err) {
    console.error('get users error', err);
    return res.status(500).json({ ok: false, message: 'Error fetching users' });
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

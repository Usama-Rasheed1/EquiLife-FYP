const Message = require('../models/Message');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Create a new message (used by API)
exports.createMessage = async (req, res) => {
  try {
    const { sender, content, groupName } = req.body;
    const message = new Message({ sender, content, groupName });
    await message.save();
    const populated = await message.populate('sender', 'fullName profilePhoto phone gender');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get messages (optionally by group)
exports.getMessages = async (req, res) => {
  try {
    const { groupName } = req.query;
    if (!groupName) return res.status(400).json({ error: 'groupName is required' });

    // optional: if includeAll=true is provided, return all messages for the group
    const { includeAll } = req.query;
    let joinedAt = new Date(0);
    if (!includeAll || includeAll !== 'true') {
      const userId = req.user?.id;
      if (userId) {
        const user = await User.findById(userId).select('createdAt');
        if (user) joinedAt = user.createdAt || joinedAt;
      }
    }

    // support legacy docs that used `group` instead of `groupName`
    const filter = includeAll === 'true'
      ? { $or: [{ groupName }, { group: groupName }] }
      : {
        $and: [
          { createdAt: { $gte: joinedAt } },
          { $or: [{ groupName }, { group: groupName }] },
        ],
      };
    const messages = await Message.find(filter).populate('sender', 'fullName profilePhoto phone gender').sort({ createdAt: 1 });

    // normalize shape for frontend
    const normalized = messages.map((m) => {
      // Determine avatar based on gender if no profile photo
      let avatar = m.sender?.profilePhoto;
      if (!avatar) {
        avatar = (m.sender?.gender && m.sender.gender.toLowerCase() === 'female') ? '/user2.png' : '/user.jpg';
      }
      
      return {
        id: m._id,
        _id: m._id,
        groupName: m.groupName || m.group || (m.group && m.group.toString && m.group.toString()) || groupName,
        message: m.content || m.message,
        senderId: m.sender?._id,
        sender: m.sender?.fullName || 'Anonymous',
        avatar,
        phone: m.sender?.phone || '',
        timestamp: m.createdAt,
      };
    });

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Report abuse for a message
exports.reportAbuse = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ ok: false, message: 'Unauthorized' });

    const { messageId } = req.params;
    if (!messageId) return res.status(400).json({ ok: false, message: 'messageId is required' });

    if (!messageId || !messageId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ ok: false, message: 'Invalid messageId' });
    }

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ ok: false, message: 'Message not found' });

    // check if user already reported
    const already = (message.reportedBy || []).some((id) => String(id) === String(userId));
    if (already) return res.status(400).json({ ok: false, message: 'You have already reported this message' });

    message.reportedBy = message.reportedBy || [];
    message.reportedBy.push(userId);
    message.abuseCount = (message.abuseCount || 0) + 1;
    await message.save();

    return res.json({ ok: true, message: 'Message reported', abuseCount: message.abuseCount });
  } catch (err) {
    console.error('reportAbuse error', err);
    return res.status(500).json({ ok: false, message: 'Error reporting message' });
  }
};

// Get a single message and include whether current user has reported it (optional auth)
exports.getMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!messageId || !messageId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ ok: false, message: 'Invalid messageId' });
    }

    const message = await Message.findById(messageId).populate('sender', 'fullName profilePhoto phone gender');
    if (!message) return res.status(404).json({ ok: false, message: 'Message not found' });

    // Try to read optional token to determine if current user reported
    let reportedByCurrentUser = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
        const decoded = jwt.verify(token, secret);
        const userId = decoded.id;
        if (userId) {
          reportedByCurrentUser = (message.reportedBy || []).some((id) => String(id) === String(userId));
        }
      } catch (err) {
        // ignore token errors and treat as unauthenticated
      }
    }

    // build normalized message shape similar to getMessages
    let avatar = message.sender?.profilePhoto;
    if (!avatar) {
      avatar = (message.sender?.gender && message.sender.gender.toLowerCase() === 'female') ? '/user2.png' : '/user.jpg';
    }

    const normalized = {
      id: message._id,
      _id: message._id,
      groupName: message.groupName || message.group || (message.group && message.group.toString && message.group.toString()),
      message: message.content || message.message,
      senderId: message.sender?._id,
      sender: message.sender?.fullName || 'Anonymous',
      avatar,
      phone: message.sender?.phone || '',
      timestamp: message.createdAt,
      reportedByCurrentUser,
    };

    return res.json({ ok: true, message: normalized });
  } catch (err) {
    console.error('getMessage error', err);
    return res.status(500).json({ ok: false, message: 'Error fetching message' });
  }
};
const Message = require('../models/Message');
const User = require('../models/User');

// Create a new message (used by API)
exports.createMessage = async (req, res) => {
  try {
    const { sender, content, groupName } = req.body;
    const message = new Message({ sender, content, groupName });
    await message.save();
    const populated = await message.populate('sender', 'fullName profilePhoto phone');
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
    const messages = await Message.find(filter).populate('sender', 'fullName profilePhoto phone').sort({ createdAt: 1 });

    // normalize shape for frontend
    const normalized = messages.map((m) => ({
  id: m._id,
  _id: m._id,
  groupName: m.groupName || m.group || (m.group && m.group.toString && m.group.toString()) || groupName,
  message: m.content || m.message,
      senderId: m.sender?._id,
      sender: m.sender?.fullName || 'Anonymous',
      avatar: m.sender?.profilePhoto || '/user.jpg',
      phone: m.sender?.phone || '',
      timestamp: m.createdAt,
    }));

    res.json(normalized);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
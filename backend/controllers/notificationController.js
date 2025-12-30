const notificationService = require('../services/notificationService');

exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const notes = await notificationService.fetchForUser(userId);
    const count = await notificationService.unreadCount(userId);
    return res.json({ notifications: notes, unreadCount: count });
  } catch (err) {
    console.error('Get notifications error', err);
    return res.status(500).json({ message: 'Error fetching notifications' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const count = await notificationService.unreadCount(userId);
    return res.json({ unreadCount: count });
  } catch (err) {
    console.error('Unread count error', err);
    return res.status(500).json({ message: 'Error fetching unread count' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const id = req.params.id;
    const n = await notificationService.markRead(userId, id);
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    const count = await notificationService.unreadCount(userId);
    return res.json({ notification: n, unreadCount: count });
  } catch (err) {
    console.error('Mark read error', err);
    return res.status(500).json({ message: 'Error marking notification as read' });
  }
};

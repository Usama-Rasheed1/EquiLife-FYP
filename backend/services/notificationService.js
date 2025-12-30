const Notification = require('../models/Notification');
const templates = require('../utils/notificationTemplates');
const User = require('../models/User');

/**
 * Create a notification for a user from a template.
 * options: { templateId, override: { title, message, action }, expiresInDays }
 */
async function createFromTemplate(userId, templateId, options = {}) {
  const tpl = templates[templateId];
  if (!tpl && !options.override) throw new Error('Unknown template');

  const payload = {
    userId,
    templateId: tpl ? tpl.id : null,
    title: options.override?.title || (tpl && tpl.title) || 'Notification',
    message: options.override?.message || (tpl && tpl.message) || '',
    type: (tpl && tpl.type) || options.override?.type || 'info',
    action: options.override?.action || (tpl && tpl.action) || null,
    isRead: false
  };

  if (options.expiresInDays) {
    const expiresAt = new Date(Date.now() + options.expiresInDays * 24 * 3600 * 1000);
    payload.expiresAt = expiresAt;
  }

  // Prevent duplicate of same template within the window if requested
  if (options.preventDuplicateDays && tpl) {
    const windowStart = new Date(Date.now() - options.preventDuplicateDays * 24 * 3600 * 1000);
    const exists = await Notification.findOne({ userId, templateId: tpl.id, createdAt: { $gte: windowStart } });
    if (exists) {
      console.debug('[notifications] duplicate prevented', { userId: String(userId), templateId: tpl.id });
      return null; // already exists in window
    }
  }

  const note = await Notification.create(payload);
  console.debug('[notifications] created', { userId: String(userId), templateId: payload.templateId, id: note._id });
  return note;
}

async function fetchForUser(userId, { limit = 50, skip = 0 } = {}) {
  const notes = await Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  return notes;
}

async function unreadCount(userId) {
  return await Notification.countDocuments({ userId, isRead: false });
}

async function markRead(userId, notificationId) {
  const n = await Notification.findOneAndUpdate({ _id: notificationId, userId }, { isRead: true }, { new: true });
  return n;
}

// Helper: create welcome + profile reminders on first login
async function createInitialNotifications(userId) {
  // Ensure user exists
  const u = await User.findById(userId);
  if (!u) return;

  // Welcome
  console.debug('[notifications] createInitialNotifications for', String(userId));
  const w = await createFromTemplate(userId, 'WELCOME', { preventDuplicateDays: 30 });
  if (w) console.debug('[notifications] welcome created', w._id);

  // Profile reminder - don't duplicate if recently created
  const p = await createFromTemplate(userId, 'PROFILE_REMINDER', { preventDuplicateDays: 30 });
  if (p) console.debug('[notifications] profile reminder created', p._id);
}

module.exports = { createFromTemplate, fetchForUser, unreadCount, markRead, createInitialNotifications };

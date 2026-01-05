require('dotenv').config();
const mongoose = require('mongoose');
const http = require('http');
const app = require('./app');
const { initializeSocket } = require('./socket');
const cron = require('node-cron');
const notificationService = require('./services/notificationService');
const Assessment = require('./models/Assessment');
const User = require('./models/User');

function getISOWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date - yearStart) / 86400000) + 1)/7);
}

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO server initialized`);
    });

    // Schedule weekly job: every Monday at 03:00 server time
    cron.schedule('0 3 * * 1', async () => {
      try {
        console.log('[cron] Weekly assessment reminder running');
        // find users who did not submit any assessment this week
        const now = new Date();
        const day = now.getDay();
        const diffToMonday = (day + 6) % 7; // days since last Monday
        const monday = new Date(now);
        monday.setDate(now.getDate() - diffToMonday);
        monday.setHours(0,0,0,0);

        const users = await User.find({}, '_id');
        for (const u of users) {
          const hasThisWeek = await Assessment.exists({ userId: u._id, submittedAt: { $gte: monday } });
          if (!hasThisWeek) {
            await notificationService.createFromTemplate(u._id, 'WEEKLY_ASSESSMENT', { preventDuplicateDays: 7 }).catch(e => console.error('cron notify err', e));
          }
        }
        console.log('[cron] Weekly assessment reminders completed');
      } catch (err) {
        console.error('[cron] weekly job error', err);
      }
    });

    // Schedule bi-weekly job: every Monday
    cron.schedule('0 4 * * 1', async () => {
      try {
        const now = new Date();
        const week = getISOWeekNumber(now);
        // choose parity (even weeks)
        if (week % 2 !== 0) {
          console.log('[cron] Skipping bi-weekly this week (parity)');
          return;
        }
        console.log('[cron] Bi-weekly fitness reminder running');
        const cutoff = new Date(Date.now() - 14 * 24 * 3600 * 1000);
        // Users whose profile wasn't updated in last 14 days
        const users = await User.find({ updatedAt: { $lte: cutoff } }, '_id');
        for (const u of users) {
          await notificationService.createFromTemplate(u._id, 'BIWEEKLY_FITNESS', { preventDuplicateDays: 14 }).catch(e => console.error('cron notify err', e));
        }
        console.log('[cron] Bi-weekly fitness reminders completed');
      } catch (err) {
        console.error('[cron] bi-weekly job error', err);
      }
    });
  })
  .catch(err => console.log('DB Error:', err));

const mongoose = require('mongoose');

const WeeklyLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekStart: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD (Monday)

  totalCalories: { type: Number, default: 0 },
  totalMinutes: { type: Number, default: 0 },
  totalReps: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now },
});

WeeklyLogSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyLog', WeeklyLogSchema);

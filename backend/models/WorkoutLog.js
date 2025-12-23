const mongoose = require('mongoose');

const WorkoutLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workoutId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'workoutModel' },
  workoutModel: { type: String, required: true, enum: ['WorkoutPredefined', 'WorkoutCustom'] },
  durationMinutes: { type: Number, required: true, min: 0 },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  createdAt: { type: Date, default: Date.now },
});

// Compound index for fast per-user/day lookups
WorkoutLogSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('WorkoutLog', WorkoutLogSchema);

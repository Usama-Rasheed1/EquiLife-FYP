const mongoose = require('mongoose');

const WorkoutItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weeklyLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'WeeklyLog', required: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD

  workoutId: { type: mongoose.Schema.Types.ObjectId, refPath: 'workoutModel' },
  workoutModel: { type: String, enum: ['WorkoutPredefined', 'WorkoutCustom'] },

  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['continuous', 'discrete'], required: true },

  // snapshot fields
  caloriesPerMinute: { type: Number, default: 0 },
  caloriesPerRep: { type: Number, default: 0 },

  duration: { type: Number, default: 0 }, // minutes for continuous
  reps: { type: Number, default: 0 }, // reps for discrete

  caloriesBurned: { type: Number, default: 0 }, // snapshot total
  isCustom: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WorkoutItem', WorkoutItemSchema);

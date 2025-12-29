const mongoose = require('mongoose');

const ExerciseLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Dynamic reference to either ExercisePredefined or ExerciseCustom
  exerciseId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'exerciseModel' },
  exerciseModel: { type: String, required: true, enum: ['ExercisePredefined', 'ExerciseCustom'] },
  day: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
  // Store date in YYYY-MM-DD format for the week (Monday of the week)
  weekStart: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  // For continuous exercises: duration in minutes
  duration: { type: Number, default: null },
  // For discrete exercises: reps/sets
  reps: { type: Number, default: null },
  // Calculated calories burned (snapshot at log time)
  caloriesBurned: { type: Number, required: true, min: 0 },
  createdAt: { type: Date, default: Date.now },
});

// Compound index for fast per-user/week lookups
ExerciseLogSchema.index({ userId: 1, weekStart: 1 });

// Prevent the same user from logging the same exerciseId for the same day and week more than once
// This makes an exercise uniquely identified per user/day/week
ExerciseLogSchema.index({ userId: 1, weekStart: 1, day: 1, exerciseId: 1 }, { unique: true });

module.exports = mongoose.model('ExerciseLog', ExerciseLogSchema);


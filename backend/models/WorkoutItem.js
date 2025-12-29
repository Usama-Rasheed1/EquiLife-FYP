const mongoose = require('mongoose');

const WorkoutItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    weeklyLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'WeeklyLog', required: true, index: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // YYYY-MM-DD

    // optional link to the source workout (predefined or custom)
    workoutId: { type: mongoose.Schema.Types.ObjectId },
    workoutModel: { type: String, enum: ['WorkoutPredefined', 'WorkoutCustom'] },

    // snapshot fields (copied at log time)
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['continuous', 'discrete'], required: true },
    intensity: { type: String },

    caloriesPerMinute: { type: Number, default: 0 },
    caloriesPerRep: { type: Number, default: 0 },

    duration: { type: Number, default: 0 }, // minutes for continuous
    reps: { type: Number, default: 0 }, // reps for discrete

    caloriesBurned: { type: Number, default: 0 },
    isCustom: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WorkoutItem', WorkoutItemSchema);

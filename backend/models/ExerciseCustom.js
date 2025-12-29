const mongoose = require('mongoose');

const ExerciseCustomSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ['continuous', 'discrete'] },
  caloriesPerMinute: { type: Number, default: 0 }, // for continuous exercises
  caloriesPerRep: { type: Number, default: 0 }, // for discrete exercises
  intensity: { type: String, enum: ['low', 'moderate', 'high'], default: 'moderate' },
  notes: { type: String },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ExerciseCustom', ExerciseCustomSchema);


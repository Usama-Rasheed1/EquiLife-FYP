const mongoose = require('mongoose');

const ExercisePredefinedSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, enum: ['continuous', 'discrete'] },
  caloriesPerMinute: { type: Number, default: 0 }, // for continuous exercises
  caloriesPerRep: { type: Number, default: 0 }, // for discrete exercises
  intensity: { type: String, enum: ['low', 'moderate', 'high'], default: 'moderate' },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ExercisePredefined', ExercisePredefinedSchema);


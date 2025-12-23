const mongoose = require('mongoose');

const WorkoutPredefinedSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  caloriesPerMinute: { type: Number, default: 0 },
  intensity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WorkoutPredefined', WorkoutPredefinedSchema);

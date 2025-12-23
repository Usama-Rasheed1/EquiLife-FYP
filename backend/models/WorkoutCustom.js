const mongoose = require('mongoose');

const WorkoutCustomSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  caloriesPerMinute: { type: Number, default: 0 },
  intensity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  notes: { type: String },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('WorkoutCustom', WorkoutCustomSchema);

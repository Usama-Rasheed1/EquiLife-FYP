const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  xp_points: { type: Number, required: true, min: 0 }, // XP points awarded on completion
  badgeName: { type: String, enum: ['physical', 'mental'], required: true }, // Challenge category
  totalDays: { type: Number, required: true, min: 1, default: 1 }, // Number of days to complete
  cooldownHours: { type: Number, required: true, default: 24, min: 0 }, // Cooldown period in hours
  status: { type: String, enum: ['active', 'inactive'], default: 'active' } // Challenge status
}, {
  timestamps: true
});

// Index for active challenges
ChallengeSchema.index({ status: 1, badgeName: 1 });

module.exports = mongoose.model('Challenge', ChallengeSchema);

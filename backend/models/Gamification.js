const mongoose = require('mongoose');

const gamificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  activeChallenges: [{
    challengeId: Number,
    startedAt: Date,
    currentProgress: { type: Number, default: 0 },
    totalDays: { type: Number, default: 1 },
    lastUpdateDate: Date,
    title: String,
    xp: Number
  }],
  completedChallenges: [{
    challengeId: Number,
    completedAt: Date,
    pointsEarned: Number,
    title: String
  }],
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActivity: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Gamification', gamificationSchema);
const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  goalType: {
    type: String,
    required: true,
    enum: ['weight', 'gad7', 'phq9', 'ghq12', 'protein', 'calories_burned'],
    index: true
  },
  title: { type: String, required: true },
  description: { type: String },
  metric: { type: String, required: true },
  improvementDirection: {
    type: String,
    required: true,
    enum: ['increase', 'decrease']
  },
  // Base value when goal was started
  baseValue: { type: Number, required: true },
  // Target value calculated from base value
  targetValue: { type: Number, required: true },
  // Current value (updated automatically)
  currentValue: { type: Number, required: true },
  // Progress percentage (0-100)
  progress: { type: Number, default: 0, min: 0, max: 100 },
  // Status: not_started, in_progress, almost_done, completed
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'almost_done', 'completed'],
    default: 'in_progress'
  },
  // Activation and completion times
  activatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  // Track if goal was restarted (for completed goals)
  isRestarted: { type: Boolean, default: false },
  previousCompletionAt: { type: Date }
}, { timestamps: true });

// Compound index to prevent duplicate active goals of the same type
goalSchema.index({ userId: 1, goalType: 1, status: 1 });

// Method to update progress
goalSchema.methods.updateProgress = function() {
  const { baseValue, targetValue, currentValue, improvementDirection } = this;
  
  let progress = 0;
  
  if (improvementDirection === 'decrease') {
    // For decrease: progress = (baseValue - currentValue) / (baseValue - targetValue) * 100
    const totalChange = baseValue - targetValue;
    const currentChange = baseValue - currentValue;
    if (totalChange > 0) {
      progress = Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
    } else {
      progress = 100; // Already at or below target
    }
  } else {
    // For increase: progress = (currentValue - baseValue) / (targetValue - baseValue) * 100
    const totalChange = targetValue - baseValue;
    const currentChange = currentValue - baseValue;
    if (totalChange > 0) {
      progress = Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
    } else {
      progress = 100; // Already at or above target
    }
  }
  
  this.progress = Math.round(progress * 100) / 100; // Round to 2 decimal places
  
  // Update status based on progress
  if (this.progress >= 100) {
    this.status = 'completed';
    if (!this.completedAt) {
      this.completedAt = new Date();
    }
  } else if (this.progress >= 80) {
    this.status = 'almost_done';
  } else if (this.progress > 0) {
    this.status = 'in_progress';
  } else {
    this.status = 'not_started';
  }
};

module.exports = mongoose.model('Goal', goalSchema);


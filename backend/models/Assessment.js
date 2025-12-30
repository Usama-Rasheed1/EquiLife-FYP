const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  assessmentType: {
    type: String,
    required: true,
    enum: ['gad7', 'phq9', 'ghq12'],
    index: true
  },
  score: { type: Number, required: true, min: 0 },
  severity: { type: String },
  answers: [{ type: Number }], // Store answer indices
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for getting latest assessment by type
assessmentSchema.index({ userId: 1, assessmentType: 1, submittedAt: -1 });

module.exports = mongoose.model('Assessment', assessmentSchema);


const mongoose = require("mongoose");

// Schema for individual assessment attempts (daily tracking)
const assessmentAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assessmentType: {
      type: String,
      enum: ["GAD-7", "PHQ-9", "GHQ-12"],
      required: true,
    },
    score: { type: Number, required: true },
    severity: { type: String, required: true },
    takenAt: { type: Date, default: Date.now, required: true },
    weekStartDate: {
      type: Date,
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number,
      min: 1,
      max: 7,
      required: true,
    },
  },
  { timestamps: true }
);

// Compound index for quick lookup: one test per assessment type per day
assessmentAttemptSchema.index(
  { userId: 1, assessmentType: 1, takenAt: 1 },
  { unique: false }
);

// Index for efficient weekly queries
assessmentAttemptSchema.index({ userId: 1, weekStartDate: 1 });

module.exports = mongoose.model("AssessmentAttempt", assessmentAttemptSchema);

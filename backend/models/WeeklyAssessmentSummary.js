const mongoose = require("mongoose");

// Schema for weekly aggregated assessment data
// One record per user per week (not per day)
const weeklyAssessmentSummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    weekNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    // Single assessment score per week (null if not taken that week)
    gadScore: {
      type: Number,
      min: 0,
      max: 21,
      default: null,
    },
    phqScore: {
      type: Number,
      min: 0,
      max: 27,
      default: null,
    },
    ghqScore: {
      type: Number,
      min: 0,
      max: 12,
      default: null,
    },
    // Track when this week record was last updated (used for week calculation)
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound unique index for user + week number
weeklyAssessmentSummarySchema.index(
  { userId: 1, weekNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "WeeklyAssessmentSummary",
  weeklyAssessmentSummarySchema
);

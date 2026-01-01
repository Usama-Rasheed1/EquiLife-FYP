const mongoose = require("mongoose");

// Schema for weekly aggregated assessment data
const weeklyAssessmentSummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    weekStartDate: {
      type: Date,
      required: true,
      index: true,
    },
    // Arrays of 7 elements (Monday=1 to Sunday=7), null for days without data
    gadScores: {
      type: [{ type: Number, min: 0, max: 21 }],
      default: [null, null, null, null, null, null, null],
    },
    phqScores: {
      type: [{ type: Number, min: 0, max: 27 }],
      default: [null, null, null, null, null, null, null],
    },
    ghqScores: {
      type: [{ type: Number, min: 0, max: 12 }],
      default: [null, null, null, null, null, null, null],
    },
  },
  { timestamps: true }
);

// Compound index for unique user + week combination
weeklyAssessmentSummarySchema.index(
  { userId: 1, weekStartDate: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "WeeklyAssessmentSummary",
  weeklyAssessmentSummarySchema
);

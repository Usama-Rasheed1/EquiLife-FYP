const mongoose = require("mongoose");

const assessmentResultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessment",
      required: true,
    },
    assessmentName: {
      type: String,
      enum: ["GAD-7", "PHQ-9", "GHQ-12"],
      required: true,
    },
    totalScore: { type: Number, required: true },
    answers: {
      type: Map,
      of: Number, // questionIndex -> selectedOptionWeight
    },
    severityLabel: { type: String }, // e.g., "Mild", "Moderate", "Severe"
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AssessmentResult", assessmentResultSchema);

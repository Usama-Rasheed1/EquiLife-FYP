const mongoose = require("mongoose");

// Assessment Option Schema
const AssessmentOptionSchema = new mongoose.Schema(
  {
    optionText: { type: String, required: true },
    weight: { type: Number, required: true }, // 0-3 for GAD-7/PHQ-9, varies for GHQ-12
    optionOrder: { type: Number, required: true }, // To maintain order from DB
  },
  { _id: true }
);

// Assessment Question Schema
const AssessmentQuestionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    questionOrder: { type: Number, required: true }, // To maintain order from DB
    options: [AssessmentOptionSchema], // Embed options directly
  },
  { _id: true }
);

// Main Assessment Schema
const assessmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["GAD-7", "PHQ-9", "GHQ-12"],
      required: true,
      unique: true,
    },
    shortName: { type: String, required: true }, // e.g., "Anxiety Assessment"
    description: { type: String, required: true },
    scoringType: {
      type: String,
      enum: ["likert", "binary"],
      default: "likert",
    },
    totalQuestions: { type: Number, required: true },
    questions: [AssessmentQuestionSchema], // Embed all questions with their options
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assessment", assessmentSchema);

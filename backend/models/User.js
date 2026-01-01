const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Sub-schemas for challenge tracking
const ActiveChallengeSchema = new mongoose.Schema({
  challengeId: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be ObjectId or string/number
  startedAt: { type: Date, required: true }
}, { _id: false });

const CompletedChallengeSchema = new mongoose.Schema({
  challengeId: { type: mongoose.Schema.Types.Mixed, required: true }, // Can be ObjectId or string/number
  completedAt: { type: Date, required: true }
}, { _id: false });

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: { type: String, required: true },

  fullName: { type: String, trim: true },
  gender: { type: String, enum: ["male", "female"] },
  dob: { type: Date },
  age: { type: Number }, // Age in years
  heightCm: { type: Number },
  weightKg: { type: Number },
  // Fitness calculations
  bmi: { type: Number }, // Body Mass Index
  bmr: { type: Number }, // Basal Metabolic Rate
  dailyCalories: {
    sedentary: { type: Number },
    lightActivity: { type: Number },
    moderateActivity: { type: Number },
    active: { type: Number },
    veryActive: { type: Number },
  },
  // Total XP/points earned from completing challenges
  totalPoints: { type: Number, default: 0, min: 0 },
  // Gamification: track active and completed challenges
  activeChallenges: { type: [ActiveChallengeSchema], default: [] },
  completedChallenges: { type: [CompletedChallengeSchema], default: [] },
  badges: { type: [String], default: [] },
  // Profile photo stored as base64 string
  profilePhoto: { type: String }
}, { timestamps: true });

// hash password automatically when created/changed
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Remove use_xp field if it exists (cleanup for old documents)
// This ensures the deprecated field is never saved, even if present in the document
userSchema.pre("save", function (next) {
  if (this.get('use_xp') !== undefined) {
    this.set('use_xp', undefined);
    this.$unset('use_xp');
  }
  next();
});

module.exports = mongoose.model("User", userSchema);

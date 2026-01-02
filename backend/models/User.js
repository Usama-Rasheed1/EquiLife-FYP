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

// Auto-calculate BMI and BMR using existing formulas when height/weight are available
userSchema.pre("save", function (next) {
  // Auto-calculate age from dob if available
  if (this.dob) {
    const birthDate = new Date(this.dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    this.age = calculatedAge;
  }
  
  // Calculate BMI if height and weight are available
  if (this.heightCm && this.weightKg) {
    const w = this.weightKg;
    const h = this.heightCm / 100; // Convert cm to meters
    
    // BMI calculation - WHO standard formula (same as FitnessCalculations.jsx)
    const bmiValue = w / (h * h);
    this.bmi = Math.max(10, Math.min(60, Math.round(bmiValue * 10) / 10));
    
    // Calculate BMR if age and gender are available
    if (this.age && this.gender) {
      // BMR calculation - Mifflin-St Jeor Equation (same as FitnessCalculations.jsx)
      let bmrValue;
      if (this.gender === "male") {
        bmrValue = 10 * w + 6.25 * this.heightCm - 5 * this.age + 5;
      } else {
        bmrValue = 10 * w + 6.25 * this.heightCm - 5 * this.age - 161;
      }
      this.bmr = Math.max(800, Math.min(4000, Math.round(bmrValue)));
      
      // Calculate daily calories for different activity levels (same as FitnessCalculations.jsx)
      if (this.bmr) {
        this.dailyCalories = {
          sedentary: Math.round(this.bmr * 1.2),
          lightActivity: Math.round(this.bmr * 1.375),
          moderateActivity: Math.round(this.bmr * 1.55),
          active: Math.round(this.bmr * 1.725),
          veryActive: Math.round(this.bmr * 1.9)
        };
      }
    }
  }
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

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
}, { timestamps: true });

// hash password automatically when created/changed
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("User", userSchema);

const mongoose = require('mongoose');

const MealLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Dynamic reference to either MealPredefined or MealCustom
  mealId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'mealModel' },
  mealModel: { type: String, required: true, enum: ['MealPredefined', 'MealCustom'] },
  mealType: { type: String, required: true, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
  quantity: { type: Number, required: true, min: 0 },
  // store date in YYYY-MM-DD format as a string for easy querying/indexing
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  createdAt: { type: Date, default: Date.now },
});

// Compound index for fast per-user/day lookups
MealLogSchema.index({ userId: 1, date: 1 });

// Prevent the same user from logging the same mealId for the same date and mealType more than once
// This makes a meal uniquely identified per user/date/mealType
MealLogSchema.index({ userId: 1, date: 1, mealType: 1, mealId: 1 }, { unique: true });

module.exports = mongoose.model('MealLog', MealLogSchema);

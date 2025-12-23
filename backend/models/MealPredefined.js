const mongoose = require('mongoose');

const MealPredefinedSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  calories: { type: Number, required: true },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  servingSize: { type: Number, default: 1 },
  unit: { type: String, default: 'serving' },
  // Optional categories this predefined meal commonly belongs to.
  // Examples: ['breakfast', 'snack'] — used as a hint/validation when logging.
  defaultMealTypes: [{ type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'] }],
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MealPredefined', MealPredefinedSchema);

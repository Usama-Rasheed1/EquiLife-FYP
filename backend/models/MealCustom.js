const mongoose = require('mongoose');

const MealCustomSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  calories: { type: Number, required: true },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  servingSize: { type: Number, default: 1 },
  unit: { type: String, default: 'serving' },
  notes: { type: String },
  // Optional categories the custom meal belongs to (helps enforce meal-type logging)
  defaultMealTypes: [{ type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'] }],
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MealCustom', MealCustomSchema);

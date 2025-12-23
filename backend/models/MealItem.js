const mongoose = require('mongoose');

const MealItemSchema = new mongoose.Schema(
  {
    dailyLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyLog', required: true, index: true },
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food', required: true },
    mealType: { type: String, enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'], required: true },
    quantity: { type: Number, required: true, default: 1 },
    // Snapshot fields copied from Food at log time
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    grams: { type: Number, required: true },
    // keep reference for tracing but DO NOT recalc from Food
  },
  { timestamps: true }
);

module.exports = mongoose.model('MealItem', MealItemSchema);

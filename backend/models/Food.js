const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    grams: { type: Number, required: true },
    isCustom: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: function() { return this.isCustom; } },
  },
  { timestamps: true }
);

// Foods are immutable in this model usage: application-level rule
module.exports = mongoose.model('Food', FoodSchema);

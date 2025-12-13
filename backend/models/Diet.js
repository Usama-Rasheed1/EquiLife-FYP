const mongoose = require('mongoose');

const macroSchema = new mongoose.Schema({ description: { type: String, default: '' }, carbs: { type: Number, default: 0 }, fats: { type: Number, default: 0 }, protein: { type: Number, default: 0 } }, { _id: false });

const dietSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  breakfast: { type: macroSchema, default: () => ({}) },
  lunch: { type: macroSchema, default: () => ({}) },
  dinner: { type: macroSchema, default: () => ({}) },
  totals: {
    carbs: { type: Number, default: 0 },
    fats: { type: Number, default: 0 },
    protein: { type: Number, default: 0 }
  }
}, { timestamps: true });

// ensure a single diet doc per user per day
dietSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Diet', dietSchema);

const Food = require('../models/Food');
const DailyLog = require('../models/DailyLog');
const MealItem = require('../models/MealItem');
const mongoose = require('mongoose');

// Helper to find or create daily log
async function findOrCreateDailyLog(userId, date) {
  const filter = { userId: new mongoose.Types.ObjectId(userId), date };
  const update = { $setOnInsert: { userId: new mongoose.Types.ObjectId(userId), date } };
  const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
  // Note: findOneAndUpdate used to atomically create if missing
  const doc = await DailyLog.findOneAndUpdate(filter, update, opts);
  return doc;
}

// POST /api/meals/log
// body: { date, mealType, foodId, quantity }
exports.logMeal = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { date, mealType, foodId, quantity } = req.body;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: 'Invalid date' });
    if (!foodId || !mongoose.Types.ObjectId.isValid(foodId)) return res.status(400).json({ message: 'Invalid foodId' });
    if (!['Breakfast', 'Lunch', 'Dinner', 'Snacks'].includes(mealType)) return res.status(400).json({ message: 'Invalid mealType' });
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) return res.status(400).json({ message: 'Invalid quantity' });

    // Fetch food (source of truth)
    const food = await Food.findById(foodId).lean();
    if (!food) return res.status(400).json({ message: 'Food not found' });

    // Find or create DailyLog
    const dailyLog = await findOrCreateDailyLog(userId, date);

    // Create MealItem with snapshot values copied from Food
    const mealItem = new MealItem({
      dailyLogId: dailyLog._id,
      foodId: food._id,
      mealType,
      quantity: qty,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      grams: food.grams,
    });

    // Save mealItem (without transaction, standalone MongoDB doesn't support them)
    await mealItem.save();

    // Update daily totals (atomic increment)
    const inc = {
      totalCalories: mealItem.calories * mealItem.quantity,
      totalProtein: mealItem.protein * mealItem.quantity,
      totalCarbs: mealItem.carbs * mealItem.quantity,
      totalFat: mealItem.fat * mealItem.quantity,
    };

    const updatedDaily = await DailyLog.findOneAndUpdate(
      { _id: dailyLog._id },
      { $inc: inc },
      { new: true }
    ).lean();

    return res.status(201).json({ dailyLog: updatedDaily, mealItem: mealItem.toObject() });
  } catch (err) {
    console.error('logMeal error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/meals/daily?date=YYYY-MM-DD
exports.getDailyLog = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: 'Invalid date' });

    const dailyLog = await DailyLog.findOne({ userId, date }).lean();
    if (!dailyLog) {
      // return empty template
      return res.json({ dailyLog: null, meals: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] } });
    }

    const items = await MealItem.find({ dailyLogId: dailyLog._id }).lean();

    const grouped = { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] };
    items.forEach((it) => {
      if (!grouped[it.mealType]) grouped[it.mealType] = [];
      grouped[it.mealType].push(it);
    });

    return res.json({ dailyLog, meals: grouped });
  } catch (err) {
    console.error('getDailyLog error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/meals/history?range=week|month|year&date=YYYY-MM-DD
exports.getHistory = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { range, date } = req.query;
    if (!range || !['week', 'month', 'year'].includes(range)) return res.status(400).json({ message: 'Invalid range' });
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: 'Invalid date' });

    const anchor = new Date(date + 'T00:00:00Z');
    let start = new Date(anchor);
    let end = new Date(anchor);

    if (range === 'week') {
      // compute start as 6 days before to provide 7-day window ending at date
      start.setUTCDate(anchor.getUTCDate() - 6);
    } else if (range === 'month') {
      start.setUTCDate(1);
    } else if (range === 'year') {
      start.setUTCMonth(0, 1);
    }

    // format helper
    const toYMD = (d) => d.toISOString().slice(0, 10);
    const startStr = toYMD(start);
    const endStr = toYMD(end);

    // Aggregate DailyLog for date range using stored totals only
    const pipeline = [
      { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: startStr, $lte: endStr } } },
      { $project: { date: 1, totalCalories: 1, totalProtein: 1, totalCarbs: 1, totalFat: 1 } },
      { $sort: { date: 1 } }
    ];

    const rows = await DailyLog.aggregate(pipeline);
    return res.json({ range, start: startStr, end: endStr, data: rows });
  } catch (err) {
    console.error('getHistory error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

    // PUT /api/meals/:id  -> update quantity of a MealItem
    exports.updateMeal = async (req, res) => {
      try {
        const userId = req.user && req.user.id;
        const mealItemId = req.params.id;
        const { quantity } = req.body;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!mealItemId || !mongoose.Types.ObjectId.isValid(mealItemId)) return res.status(400).json({ message: 'Invalid meal item id' });
        const newQty = Number(quantity);
        if (isNaN(newQty) || newQty <= 0) return res.status(400).json({ message: 'Invalid quantity' });

        const mealItem = await MealItem.findById(mealItemId);
        if (!mealItem) return res.status(404).json({ message: 'Meal item not found' });

        const dailyLog = await DailyLog.findById(mealItem.dailyLogId);
        if (!dailyLog) return res.status(400).json({ message: 'Daily log not found' });
        if (String(dailyLog.userId) !== String(userId)) return res.status(403).json({ message: 'Forbidden' });

        const oldQty = mealItem.quantity;
        if (oldQty === newQty) return res.json({ mealItem: mealItem.toObject(), dailyLog });

        const delta = newQty - oldQty;
        const inc = {
          totalCalories: mealItem.calories * delta,
          totalProtein: mealItem.protein * delta,
          totalCarbs: mealItem.carbs * delta,
          totalFat: mealItem.fat * delta,
        };

        // Update MealItem quantity and DailyLog totals
        const updatedMealItem = await MealItem.findByIdAndUpdate(mealItemId, { $set: { quantity: newQty } }, { new: true }).lean();
        const updatedDaily = await DailyLog.findByIdAndUpdate(dailyLog._id, { $inc: inc }, { new: true }).lean();

        return res.json({ mealItem: updatedMealItem, dailyLog: updatedDaily });
      } catch (err) {
        console.error('updateMeal error', err);
        return res.status(500).json({ message: 'Server error' });
      }
    };

    // DELETE /api/meals/:id  -> delete a MealItem and decrement DailyLog totals
    exports.deleteMeal = async (req, res) => {
      try {
        const userId = req.user && req.user.id;
        const mealItemId = req.params.id;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!mealItemId || !mongoose.Types.ObjectId.isValid(mealItemId)) return res.status(400).json({ message: 'Invalid meal item id' });

        const mealItem = await MealItem.findById(mealItemId);
        if (!mealItem) return res.status(404).json({ message: 'Meal item not found' });

        const dailyLog = await DailyLog.findById(mealItem.dailyLogId);
        if (!dailyLog) return res.status(400).json({ message: 'Daily log not found' });
        if (String(dailyLog.userId) !== String(userId)) return res.status(403).json({ message: 'Forbidden' });

        const dec = {
          totalCalories: -mealItem.calories * mealItem.quantity,
          totalProtein: -mealItem.protein * mealItem.quantity,
          totalCarbs: -mealItem.carbs * mealItem.quantity,
          totalFat: -mealItem.fat * mealItem.quantity,
        };

        // Delete meal item and update daily totals
        await MealItem.findByIdAndDelete(mealItemId);
        const updatedDaily = await DailyLog.findByIdAndUpdate(dailyLog._id, { $inc: dec }, { new: true }).lean();

        return res.json({ dailyLog: updatedDaily });
      } catch (err) {
        console.error('deleteMeal error', err);
        return res.status(500).json({ message: 'Server error' });
      }
    };

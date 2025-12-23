const MealPredefined = require('../models/MealPredefined');
const MealCustom = require('../models/MealCustom');
const MealLog = require('../models/MealLog');

// List all predefined (global) meals
exports.getPredefinedMeals = async (req, res) => {
  try {
    const meals = await MealPredefined.find().lean();
    return res.json(meals);
  } catch (err) {
    console.error('getPredefinedMeals error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create a custom meal for the logged-in user
exports.createCustomMeal = async (req, res) => {
  try {
    const { name, calories, protein, carbs, fat, servingSize, unit, notes, tags, defaultMealTypes } = req.body;

    if (!name || calories == null) {
      return res.status(400).json({ message: 'Missing required fields: name and calories' });
    }

    // Validate defaultMealTy`pes if provided
    if (defaultMealTypes !== undefined) {
      if (!Array.isArray(defaultMealTypes)) {
        return res.status(400).json({ message: 'defaultMealTypes must be an array' });
      }
      const allowed = ['breakfast', 'lunch', 'dinner', 'snack'];
      const invalid = defaultMealTypes.filter(t => !allowed.includes(t));
      if (invalid.length) {
        return res.status(400).json({ message: `Invalid defaultMealTypes entries: ${invalid.join(', ')}` });
      }
    }

    const meal = new MealCustom({
      userId: req.user.id,
      name,
      calories,
      protein,
      carbs,
      fat,
      servingSize,
      unit,
      notes,
      tags,
      defaultMealTypes
    });

    const saved = await meal.save();
    return res.status(201).json(saved.toObject());
  } catch (err) {
    console.error('createCustomMeal error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// List custom meals for the logged-in user
exports.getCustomMeals = async (req, res) => {
  try {
    const meals = await MealCustom.find({ userId: req.user.id }).lean();
    return res.json(meals);
  } catch (err) {
    console.error('getCustomMeals error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Add a meal log (for either predefined or custom meal)
exports.addMealLog = async (req, res) => {
  try {
    const { mealId, mealModel, mealType, quantity, date } = req.body;

    if (!mealId || !mealModel || !mealType || quantity == null || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['MealPredefined', 'MealCustom'].includes(mealModel)) {
      return res.status(400).json({ message: 'Invalid mealModel' });
    }

    if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
      return res.status(400).json({ message: 'Invalid mealType' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid date format, expected YYYY-MM-DD' });
    }

    // Ensure the referenced meal exists and, if it has defaultMealTypes, that the mealType is allowed
    let referencedMeal = null;
    if (mealModel === 'MealPredefined') {
      referencedMeal = await MealPredefined.findById(mealId).lean();
    } else {
      referencedMeal = await MealCustom.findById(mealId).lean();
    }

    if (!referencedMeal) {
      return res.status(400).json({ message: 'Referenced meal not found' });
    }

    if (Array.isArray(referencedMeal.defaultMealTypes) && referencedMeal.defaultMealTypes.length > 0) {
      if (!referencedMeal.defaultMealTypes.includes(mealType)) {
        return res.status(400).json({ message: `This meal is not allowed to be logged as ${mealType}` });
      }
    }

    const log = new MealLog({
      userId: req.user.id,
      mealId,
      mealModel,
      mealType,
      quantity,
      date,
    });

    const saved = await log.save();
    return res.status(201).json(saved.toObject());
  } catch (err) {
    // Duplicate key error from unique index
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Meal already logged for this user/date/type' });
    }
    console.error('addMealLog error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get meal logs for a user for a specific date
exports.getMealLogsByDate = async (req, res) => {
  try {
    const { date } = req.params;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid or missing date parameter (YYYY-MM-DD)' });
    }

    // populate the referenced meal (predefined or custom)
    const logs = await MealLog.find({ userId: req.user.id, date })
      .populate('mealId')
      .lean();

    return res.json(logs);
  } catch (err) {
    console.error('getMealLogsByDate error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

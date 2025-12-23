const Food = require('../models/Food');

// GET /api/foods/predefined
exports.getPredefinedFoods = async (req, res) => {
  try {
    const foods = await Food.find({ isCustom: false }).lean();
    return res.json(foods);
  } catch (err) {
    console.error('getPredefinedFoods error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/foods/custom (protected)
exports.getCustomFoods = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const foods = await Food.find({ isCustom: true, userId }).lean();
    return res.json(foods);
  } catch (err) {
    console.error('getCustomFoods error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/foods/custom (protected)
exports.createCustomFood = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const { name, calories, protein, carbs, fat, grams } = req.body;

    if (!name || calories == null || protein == null || carbs == null || fat == null || grams == null) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const food = new Food({
      name,
      calories,
      protein,
      carbs,
      fat,
      grams,
      isCustom: true,
      userId,
    });

    const saved = await food.save();
    return res.status(201).json(saved.toObject());
  } catch (err) {
    console.error('createCustomFood error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

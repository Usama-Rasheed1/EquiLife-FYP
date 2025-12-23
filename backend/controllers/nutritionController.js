const Diet = require('../models/Diet');

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  return d;
}

function computeTotals(meals) {
  const carbs = (meals.breakfast?.carbs || 0) + (meals.lunch?.carbs || 0) + (meals.dinner?.carbs || 0);
  const fats = (meals.breakfast?.fats || 0) + (meals.lunch?.fats || 0) + (meals.dinner?.fats || 0);
  const protein = (meals.breakfast?.protein || 0) + (meals.lunch?.protein || 0) + (meals.dinner?.protein || 0);
  return { carbs, fats, protein };
}

exports.getTodayDiet = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const date = startOfDay();
    const diet = await Diet.findOne({ user: userId, date }).lean();
    if (!diet) return res.json({ breakfast: {}, lunch: {}, dinner: {}, totals: { carbs:0, fats:0, protein:0 } });
    return res.json(diet);
  } catch (err) {
    console.error('Get diet error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.saveTodayDiet = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { breakfast = {}, lunch = {}, dinner = {} } = req.body;
    const meals = {
      breakfast: { description: breakfast.description || '', carbs: Number(breakfast.carbs) || 0, fats: Number(breakfast.fats) || 0, protein: Number(breakfast.protein) || 0 },
      lunch: { description: lunch.description || '', carbs: Number(lunch.carbs) || 0, fats: Number(lunch.fats) || 0, protein: Number(lunch.protein) || 0 },
      dinner: { description: dinner.description || '', carbs: Number(dinner.carbs) || 0, fats: Number(dinner.fats) || 0, protein: Number(dinner.protein) || 0 }
    };

    const totals = computeTotals(meals);
    const date = startOfDay();
    const update = { user: userId, date, breakfast: meals.breakfast, lunch: meals.lunch, dinner: meals.dinner, totals };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const diet = await Diet.findOneAndUpdate({ user: userId, date }, update, options).lean();
    return res.json(diet);
  } catch (err) {
    console.error('Save diet error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const limit = Math.min(50, Number(req.query.limit) || 7);
    const history = await Diet.find({ user: userId }).sort({ date: -1 }).limit(limit).lean();
    return res.json(history);
  } catch (err) {
    console.error('Get history error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

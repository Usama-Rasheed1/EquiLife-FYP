const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const auth = require('../middleware/authMiddleware');

// Public: list predefined global meals
router.get('/predefined', mealController.getPredefinedMeals);

// Protected: create custom meal
router.post('/custom', auth, mealController.createCustomMeal);

// Protected: list user's custom meals
router.get('/custom', auth, mealController.getCustomMeals);

// Protected: add meal log
router.post('/log', auth, mealController.addMealLog);

// Protected: get logs for a specific date (YYYY-MM-DD)
router.get('/logs/:date', auth, mealController.getMealLogsByDate);

module.exports = router;

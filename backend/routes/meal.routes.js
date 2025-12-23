const express = require('express');
const router = express.Router();
const mealController = require('../controllers/meal.controller');
const auth = require('../middleware/authMiddleware');

router.post('/log', auth, mealController.logMeal);
router.get('/daily', auth, mealController.getDailyLog);
router.get('/history', auth, mealController.getHistory);
// Update or delete a specific MealItem (by id)
router.put('/:id', auth, mealController.updateMeal);
router.delete('/:id', auth, mealController.deleteMeal);

module.exports = router;

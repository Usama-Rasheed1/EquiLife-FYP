const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const auth = require('../middleware/authMiddleware');

// Public: list predefined workouts
router.get('/predefined', workoutController.getPredefinedWorkouts);

// Protected: create custom workout
router.post('/custom', auth, workoutController.createCustomWorkout);

// Protected: list user's custom workouts
router.get('/custom', auth, workoutController.getCustomWorkouts);

// Protected: add workout log
router.post('/log', auth, workoutController.addWorkoutLog);

// Protected: get logs for a specific date (YYYY-MM-DD)
router.get('/logs/:date', auth, workoutController.getWorkoutLogsByDate);

module.exports = router;

const express = require('express');
const router = express.Router();
const fitnessController = require('../controllers/fitnessController');
const auth = require('../middleware/authMiddleware');

// Public: list predefined exercises
router.get('/predefined', fitnessController.getPredefinedExercises);

// Protected: create custom exercise
router.post('/custom', auth, fitnessController.createCustomExercise);

// Protected: list user's custom exercises
router.get('/custom', auth, fitnessController.getCustomExercises);

// Protected: update custom exercise
router.put('/custom/:id', auth, fitnessController.updateCustomExercise);

// Protected: delete custom exercise
router.delete('/custom/:id', auth, fitnessController.deleteCustomExercise);

// Protected: add exercise log
router.post('/log', auth, fitnessController.addExerciseLog);

// Protected: get logs for a specific week (grouped by day)
router.get('/logs/week', auth, fitnessController.getExerciseLogsByWeek);

// Protected: update exercise log
router.put('/log/:id', auth, fitnessController.updateExerciseLog);

// Protected: delete exercise log
router.delete('/log/:id', auth, fitnessController.deleteExerciseLog);

module.exports = router;


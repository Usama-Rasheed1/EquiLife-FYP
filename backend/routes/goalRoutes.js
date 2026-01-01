const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const auth = require('../middleware/authMiddleware');

// All routes require authentication
router.post('/start', auth, goalController.startGoal);
router.get('/', auth, goalController.getGoals);
router.get('/available', auth, goalController.getAvailableGoals);
router.get('/latest-assessments', auth, goalController.getLatestAssessments);
router.post('/:goalId/restart', auth, goalController.restartGoal);
router.delete('/:goalId', auth, goalController.endGoal);

module.exports = router;


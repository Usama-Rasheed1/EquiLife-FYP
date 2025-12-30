const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessmentController');
const auth = require('../middleware/authMiddleware');

// All routes require authentication
router.post('/submit', auth, assessmentController.submitAssessment);
router.get('/latest', auth, assessmentController.getLatestAssessments);

module.exports = router;


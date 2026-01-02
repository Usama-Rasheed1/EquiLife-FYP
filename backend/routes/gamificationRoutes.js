const express = require('express');
const router = express.Router();
const controller = require('../controllers/gamificationController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/init', verifyToken, controller.init);
router.get('/profile', verifyToken, controller.getProfile);
router.get('/challenges', verifyToken, controller.listChallenges);
router.post('/challenge/start', verifyToken, controller.startChallenge);
router.post('/challenge/update', verifyToken, controller.updateProgress);
router.post('/challenge/complete', verifyToken, controller.completeChallenge);
router.post('/challenge/delete', verifyToken, controller.deleteChallenge);
router.get('/leaderboard', verifyToken, controller.leaderboard);
router.get('/rank', verifyToken, controller.rank);

// debug status (unprotected) - lightweight
router.get('/debug/status', controller.debugStatus);

module.exports = router;
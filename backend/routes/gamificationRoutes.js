const express = require('express');
const router = express.Router();
const controller = require('../controllers/gamificationController');
const verifyToken = require('../middleware/authMiddleware');

// diagnostic: log incoming gamification route hits
router.use((req, res, next) => {
	console.log('[Gamification] route', req.method, req.originalUrl);
	next();
});

router.post('/init', verifyToken, controller.init);
router.get('/profile', verifyToken, controller.getProfile);
router.get('/challenges', verifyToken, controller.listChallenges);
router.post('/challenge/start', verifyToken, controller.startChallenge);
router.post('/challenge/complete', verifyToken, controller.completeChallenge);
router.get('/leaderboard', verifyToken, controller.leaderboard);
router.get('/rank', verifyToken, controller.rank);

// debug status (unprotected) - lightweight
router.get('/debug/status', controller.debugStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// authMiddleware exports the middleware function directly
router.use(authMiddleware);

router.get('/', notificationController.getNotifications);
router.get('/unreadCount', notificationController.getUnreadCount);
router.post('/:id/read', notificationController.markAsRead);

// Debug/test endpoint - create initial notifications for current user
router.post('/init', async (req, res) => {
	try {
		const userId = req.user && req.user.id;
		if (!userId) return res.status(401).json({ message: 'Unauthorized' });
		const notificationService = require('../services/notificationService');
		await notificationService.createInitialNotifications(userId);
		return res.json({ message: 'Initial notifications triggered' });
	} catch (err) {
		console.error('Init notifications error', err);
		return res.status(500).json({ message: 'Error triggering initial notifications' });
	}
});

module.exports = router;

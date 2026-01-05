const express = require('express');
const router = express.Router();
const { createMessage, getMessages, reportAbuse, getMessage } = require('../controllers/messageController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/', createMessage);
// allow public GET of messages; controller will optionally use req.user if present
router.get('/', getMessages);

// Get single message (optional auth via token header)
router.get('/:messageId', getMessage);

// Report abuse (authenticated)
router.post('/:messageId/report-abuse', verifyToken, reportAbuse);

module.exports = router;
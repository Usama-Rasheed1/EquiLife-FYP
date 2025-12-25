const express = require('express');
const router = express.Router();
const { createMessage, getMessages } = require('../controllers/messageController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/', createMessage);
// allow public GET of messages; controller will optionally use req.user if present
router.get('/', getMessages);

module.exports = router;
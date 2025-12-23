const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const controller = require('../controllers/nutritionController');

router.get('/', verifyToken, controller.getTodayDiet);
router.post('/', verifyToken, controller.saveTodayDiet);
router.get('/history', verifyToken, controller.getHistory);

module.exports = router;

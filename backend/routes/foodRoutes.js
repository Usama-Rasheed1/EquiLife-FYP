const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const auth = require('../middleware/authMiddleware');

router.get('/predefined', foodController.getPredefinedFoods);
router.get('/custom', auth, foodController.getCustomFoods);
router.post('/custom', auth, foodController.createCustomFood);

module.exports = router;

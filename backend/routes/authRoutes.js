const express = require('express');
const authRouter = express.Router();
const { register, login, logout, updateProfile, getProfile, saveFitnessCalculations, changePassword } = require('../controllers/authController');
const verifyToken = require('../middleware/authMiddleware');

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/profile', verifyToken, getProfile);
authRouter.put('/profile', verifyToken, updateProfile);
authRouter.post('/change-password', verifyToken, changePassword);
authRouter.post('/fitness-calculations', verifyToken, saveFitnessCalculations);

module.exports = authRouter;

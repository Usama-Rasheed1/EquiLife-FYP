const jwt = require('jsonwebtoken');

// create a short-lived access token for the user id
const generateAccessToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '1d' });

module.exports = { generateAccessToken };
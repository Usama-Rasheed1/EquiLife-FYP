const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

// lightweight CORS handling for dev: allow requests and preflight from the frontend
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
	if (req.method === 'OPTIONS') {
		res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
		return res.status(200).end();
	}
	next();
});

app.use(express.json());
app.use(cookieParser());

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
const nutritionRoutes = require('./routes/nutritionRoutes');
app.use('/api/nutrition', nutritionRoutes);

module.exports = app;

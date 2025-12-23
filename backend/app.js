const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

// Basic CORS middleware to allow requests from any origin
// This does not require the `cors` package and will allow all endpoints
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, Authorization'
	);
	// Handle preflight
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

// Mount new EquiLife routes
const workoutRoutes = require('./routes/workoutRoutes');
const newMealRoutes = require('./routes/meal.routes');
const foodRoutes = require('./routes/food.routes');

// Foods endpoints (predefined + user custom)
app.use('/api/foods', foodRoutes);

// Meal logging and retrieval (snapshot-based)
app.use('/api/meals', newMealRoutes);

// Existing workout routes kept as-is
app.use('/api/workouts', workoutRoutes);

module.exports = app;

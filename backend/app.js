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

<<<<<<< HEAD
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
=======
// Chat / community routes
const groupRoutes = require('./routes/groupRoutes');
const messageRoutes = require('./routes/messageRoutes');
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
>>>>>>> 96d94d2 (Community groups and Socket io)

module.exports = app;

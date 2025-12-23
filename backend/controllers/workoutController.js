const WorkoutPredefined = require('../models/WorkoutPredefined');
const WorkoutCustom = require('../models/WorkoutCustom');
const WorkoutLog = require('../models/WorkoutLog');

// List all predefined workouts
exports.getPredefinedWorkouts = async (req, res) => {
  try {
    const workouts = await WorkoutPredefined.find().lean();
    return res.json(workouts);
  } catch (err) {
    console.error('getPredefinedWorkouts error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create a custom workout for the user
exports.createCustomWorkout = async (req, res) => {
  try {
    const { name, caloriesPerMinute, intensity, notes, tags } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Missing required field: name' });
    }

    const workout = new WorkoutCustom({
      userId: req.user.id,
      name,
      caloriesPerMinute,
      intensity,
      notes,
      tags,
    });

    const saved = await workout.save();
    return res.status(201).json(saved.toObject());
  } catch (err) {
    console.error('createCustomWorkout error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// List user's custom workouts
exports.getCustomWorkouts = async (req, res) => {
  try {
    const workouts = await WorkoutCustom.find({ userId: req.user.id }).lean();
    return res.json(workouts);
  } catch (err) {
    console.error('getCustomWorkouts error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Add a workout log
exports.addWorkoutLog = async (req, res) => {
  try {
    const { workoutId, workoutModel, durationMinutes, date } = req.body;

    if (!workoutId || !workoutModel || durationMinutes == null || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['WorkoutPredefined', 'WorkoutCustom'].includes(workoutModel)) {
      return res.status(400).json({ message: 'Invalid workoutModel' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid date format, expected YYYY-MM-DD' });
    }

    const log = new WorkoutLog({
      userId: req.user.id,
      workoutId,
      workoutModel,
      durationMinutes,
      date,
    });

    const saved = await log.save();
    return res.status(201).json(saved.toObject());
  } catch (err) {
    console.error('addWorkoutLog error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get workout logs for a user for a specific date
exports.getWorkoutLogsByDate = async (req, res) => {
  try {
    const { date } = req.params;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid or missing date parameter (YYYY-MM-DD)' });
    }

    const logs = await WorkoutLog.find({ userId: req.user.id, date })
      .populate('workoutId')
      .lean();

    return res.json(logs);
  } catch (err) {
    console.error('getWorkoutLogsByDate error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

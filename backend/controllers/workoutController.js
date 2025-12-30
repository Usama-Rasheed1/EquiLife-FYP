const WorkoutPredefined = require('../models/WorkoutPredefined');
const WorkoutCustom = require('../models/WorkoutCustom');
const WorkoutLog = require('../models/WorkoutLog');
const WorkoutItem = require('../models/WorkoutItem');
const WeeklyLog = require('../models/WeeklyLog');
const mongoose = require('mongoose');
const goalController = require('./goalController');

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

// Helper: compute weekStart (Monday) from a date string YYYY-MM-DD
const getWeekStart = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0 (Sun) - 6
  const diffToMonday = ((day + 6) % 7);
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);
  return monday.toISOString().slice(0, 10);
};

// Create a snapshot workout item and update weekly aggregates
exports.logWorkoutSnapshot = async (req, res) => {
  try {
    const { date, workoutId, workoutModel, name, type, duration, reps, caloriesPerMinute, caloriesPerRep, intensity, isCustom } = req.body;
    const userId = req.user.id;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: 'Invalid or missing date' });
    if (!type || !['continuous','discrete'].includes(type)) return res.status(400).json({ message: 'Invalid type' });

    let calories = 0;
    if (type === 'continuous') {
      calories = Math.round((Number(caloriesPerMinute || 0) * Number(duration || 0)) * 10) / 10;
    } else {
      calories = Math.round((Number(caloriesPerRep || 0) * Number(reps || 0)) * 10) / 10;
    }

    const weekStart = getWeekStart(date);
    let weekly = await WeeklyLog.findOne({ userId, weekStart });
    if (!weekly) {
      weekly = new WeeklyLog({ userId, weekStart });
      await weekly.save();
    }

    const item = new WorkoutItem({
      userId,
      weeklyLogId: weekly._id,
      date,
      workoutId: workoutId ? mongoose.Types.ObjectId(workoutId) : undefined,
      workoutModel: workoutModel || undefined,
      name: name || 'Custom Exercise',
      type,
      intensity: intensity || undefined,
      caloriesPerMinute: Number(caloriesPerMinute) || 0,
      caloriesPerRep: Number(caloriesPerRep) || 0,
      duration: type === 'continuous' ? Number(duration) || 0 : 0,
      reps: type === 'discrete' ? Number(reps) || 0 : 0,
      caloriesBurned: calories,
      isCustom: !!isCustom,
    });

    const saved = await item.save();

    const inc = { $inc: { totalCalories: calories, totalMinutes: 0, totalReps: 0 } };
    if (type === 'continuous') inc.$inc.totalMinutes = Number(duration) || 0;
    if (type === 'discrete') inc.$inc.totalReps = Number(reps) || 0;

    await WeeklyLog.updateOne({ _id: weekly._id }, inc);

    // Update goal progress for calories_burned goals
    goalController.updateProgressForGoalType(userId, 'calories_burned').catch(err => {
      console.error('Error updating calories_burned goal progress:', err);
    });

    return res.status(201).json({ workoutItem: saved.toObject(), weeklyLog: await WeeklyLog.findById(weekly._id).lean() });
  } catch (err) {
    console.error('logWorkoutSnapshot error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get weekly log and grouped items
exports.getWeeklyLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { weekStart, date } = req.query;
    let target = weekStart || (date ? getWeekStart(date) : null);
    if (!target) return res.status(400).json({ message: 'Provide weekStart or date' });

    const weekly = await WeeklyLog.findOne({ userId, weekStart: target }).lean();
    const items = weekly ? await WorkoutItem.find({ userId, weeklyLogId: weekly._id }).lean() : [];

    // group items by weekday name
    const map = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const grouped = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };
    items.forEach(it => {
      const dayName = map[new Date(it.date + 'T00:00:00').getDay()];
      if (!grouped[dayName]) grouped[dayName] = [];
      grouped[dayName].push(it);
    });

    return res.json({ weeklyLog: weekly || null, items: grouped });
  } catch (err) {
    console.error('getWeeklyLog error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update workout item and adjust weekly totals
exports.updateWorkoutItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { duration, reps } = req.body;

    const item = await WorkoutItem.findOne({ _id: id, userId });
    if (!item) return res.status(404).json({ message: 'Not found' });

    const oldCalories = Number(item.caloriesBurned || 0);
    const oldMinutes = Number(item.duration || 0);
    const oldReps = Number(item.reps || 0);

    let newCalories = oldCalories;
    let incMinutes = 0;
    let incReps = 0;
    if (item.type === 'continuous' && duration != null) {
      const newDur = Number(duration);
      newCalories = Math.round((item.caloriesPerMinute || 0) * newDur * 10) / 10;
      incMinutes = newDur - oldMinutes;
      item.duration = newDur;
    }
    if (item.type === 'discrete' && reps != null) {
      const newR = Number(reps);
      newCalories = Math.round((item.caloriesPerRep || 0) * newR * 10) / 10;
      incReps = newR - oldReps;
      item.reps = newR;
    }

    item.caloriesBurned = newCalories;
    await item.save();

    const deltaC = newCalories - oldCalories;
    await WeeklyLog.updateOne({ _id: item.weeklyLogId }, { $inc: { totalCalories: deltaC, totalMinutes: incMinutes, totalReps: incReps } });

    // Update goal progress for calories_burned goals
    goalController.updateProgressForGoalType(userId, 'calories_burned').catch(err => {
      console.error('Error updating calories_burned goal progress:', err);
    });

    const weekly = await WeeklyLog.findById(item.weeklyLogId).lean();
    return res.json({ workoutItem: item.toObject(), weeklyLog: weekly });
  } catch (err) {
    console.error('updateWorkoutItem error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete workout item and decrement weekly totals
exports.deleteWorkoutItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const item = await WorkoutItem.findOne({ _id: id, userId });
    if (!item) return res.status(404).json({ message: 'Not found' });

    const calories = Number(item.caloriesBurned || 0);
    const minutes = Number(item.duration || 0);
    const reps = Number(item.reps || 0);

    await item.remove();
    await WeeklyLog.updateOne({ _id: item.weeklyLogId }, { $inc: { totalCalories: -calories, totalMinutes: -minutes, totalReps: -reps } });

    const weekly = await WeeklyLog.findById(item.weeklyLogId).lean();
    return res.json({ weeklyLog: weekly || null });
  } catch (err) {
    console.error('deleteWorkoutItem error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

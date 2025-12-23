const WorkoutPredefined = require('../models/WorkoutPredefined');
const WorkoutCustom = require('../models/WorkoutCustom');
const WorkoutLog = require('../models/WorkoutLog');
const WorkoutItem = require('../models/WorkoutItem');
const WeeklyLog = require('../models/WeeklyLog');
const mongoose = require('mongoose');

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
  // calculate difference to Monday (1)
  const diffToMonday = ((day + 6) % 7); // 0->6 maps Sun->6, Mon->0, ...
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);
  return monday.toISOString().slice(0, 10);
};

// Snapshot-style: Log a workout item (creates WorkoutItem snapshot and updates WeeklyLog)
exports.logWorkoutSnapshot = async (req, res) => {
  try {
    const { date, workoutId, workoutModel, name, type, duration, reps, caloriesPerMinute, caloriesPerRep, isCustom } = req.body;
    const userId = req.user.id;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: 'Invalid or missing date' });
    if (!type || !['continuous', 'discrete'].includes(type)) return res.status(400).json({ message: 'Invalid type' });

    // Compute calories snapshot
    let calories = 0;
    if (type === 'continuous') {
      const cpm = Number(caloriesPerMinute) || 0;
      const dur = Number(duration) || 0;
      calories = Math.round(cpm * dur * 10) / 10;
    } else {
      const cpr = Number(caloriesPerRep) || 0;
      const r = Number(reps) || 0;
      calories = Math.round(cpr * r * 10) / 10;
    }

    const weekStart = getWeekStart(date);

    // find or create weekly log
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
      name: name || (workoutId ? undefined : 'Custom Exercise'),
      type,
      caloriesPerMinute: Number(caloriesPerMinute) || 0,
      caloriesPerRep: Number(caloriesPerRep) || 0,
      duration: type === 'continuous' ? Number(duration) || 0 : 0,
      reps: type === 'discrete' ? Number(reps) || 0 : 0,
      caloriesBurned: calories,
      isCustom: !!isCustom,
    });

    const saved = await item.save();

    // update weekly totals
    const inc = { $inc: { totalCalories: calories, totalMinutes: 0, totalReps: 0 } };
    if (type === 'continuous') inc.$inc.totalMinutes = Number(duration) || 0;
    if (type === 'discrete') inc.$inc.totalReps = Number(reps) || 0;

    await WeeklyLog.updateOne({ _id: weekly._id }, inc);

    return res.status(201).json({ weeklyLog: await WeeklyLog.findById(weekly._id).lean(), workoutItem: saved.toObject() });
  } catch (err) {
    console.error('logWorkoutSnapshot error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get weekly log (items grouped by day)
exports.getWeeklyLog = async (req, res) => {
  try {
    const userId = req.user.id;
    const { weekStart, date } = req.query;
    let targetWeekStart = weekStart;
    if (!targetWeekStart && date) targetWeekStart = getWeekStart(date);
    if (!targetWeekStart) return res.status(400).json({ message: 'Provide weekStart or date' });

    const weekly = await WeeklyLog.findOne({ userId, weekStart: targetWeekStart }).lean();
    const items = await WorkoutItem.find({ userId, weeklyLogId: weekly ? weekly._id : null }).lean();

    // group by weekday names
    const days = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Saturday: [], Sunday: [] };
    items.forEach((it) => {
      const wd = new Date(it.date + 'T00:00:00').getDay();
      // map 1..7 where 1=Mon
      const map = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const dayName = map[wd] || 'Unknown';
      if (!days[dayName]) days[dayName] = [];
      days[dayName].push(it);
    });

    return res.json({ weeklyLog: weekly || null, items: days });
  } catch (err) {
    console.error('getWeeklyLog error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update a workout item (adjust weekly totals by delta)
exports.updateWorkoutItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { duration, reps } = req.body;

    const item = await WorkoutItem.findOne({ _id: id, userId });
    if (!item) return res.status(404).json({ message: 'Workout item not found' });

    const oldCalories = Number(item.caloriesBurned || 0);
    const oldMinutes = Number(item.duration || 0);
    const oldReps = Number(item.reps || 0);

    // compute new snapshot
    let newCalories = oldCalories;
    let incMinutes = 0;
    let incReps = 0;
    if (item.type === 'continuous') {
      const newDur = Number(duration != null ? duration : oldMinutes);
      newCalories = Math.round((item.caloriesPerMinute || 0) * newDur * 10) / 10;
      incMinutes = newDur - oldMinutes;
      item.duration = newDur;
    } else {
      const newReps = Number(reps != null ? reps : oldReps);
      newCalories = Math.round((item.caloriesPerRep || 0) * newReps * 10) / 10;
      incReps = newReps - oldReps;
      item.reps = newReps;
    }

    item.caloriesBurned = newCalories;
    await item.save();

    const deltaCalories = newCalories - oldCalories;
    await WeeklyLog.updateOne({ _id: item.weeklyLogId }, { $inc: { totalCalories: deltaCalories, totalMinutes: incMinutes, totalReps: incReps } });

    const weekly = await WeeklyLog.findById(item.weeklyLogId).lean();
    return res.json({ workoutItem: item.toObject(), weeklyLog: weekly });
  } catch (err) {
    console.error('updateWorkoutItem error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete a workout item and decrement weekly totals
exports.deleteWorkoutItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const item = await WorkoutItem.findOne({ _id: id, userId });
    if (!item) return res.status(404).json({ message: 'Workout item not found' });

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

const ExercisePredefined = require('../models/ExercisePredefined');
const ExerciseCustom = require('../models/ExerciseCustom');
const ExerciseLog = require('../models/ExerciseLog');
const goalController = require('./goalController');

// Helper: Get Monday of the week for a given date
const getWeekStart = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0 (Sun) - 6
  const diffToMonday = ((day + 6) % 7);
  const monday = new Date(d);
  monday.setDate(d.getDate() - diffToMonday);
  return monday.toISOString().slice(0, 10);
};

// Helper: Get day name from date
const getDayName = (dateStr) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()];
};

// List all predefined exercises
exports.getPredefinedExercises = async (req, res) => {
  try {
    const exercises = await ExercisePredefined.find().lean();
    return res.json(exercises);
  } catch (err) {
    console.error('getPredefinedExercises error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create a custom exercise for the logged-in user
exports.createCustomExercise = async (req, res) => {
  try {
    const { name, type, caloriesPerMinute, caloriesPerRep, intensity, notes, tags } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'Missing required fields: name and type' });
    }

    if (!['continuous', 'discrete'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type, must be "continuous" or "discrete"' });
    }

    if (type === 'continuous' && (!caloriesPerMinute || caloriesPerMinute <= 0)) {
      return res.status(400).json({ message: 'caloriesPerMinute is required for continuous exercises' });
    }

    if (type === 'discrete' && (!caloriesPerRep || caloriesPerRep <= 0)) {
      return res.status(400).json({ message: 'caloriesPerRep is required for discrete exercises' });
    }

    const exercise = new ExerciseCustom({
      userId: req.user.id,
      name,
      type,
      caloriesPerMinute: type === 'continuous' ? (caloriesPerMinute || 0) : 0,
      caloriesPerRep: type === 'discrete' ? (caloriesPerRep || 0) : 0,
      intensity: intensity || 'moderate',
      notes,
      tags,
    });

    const saved = await exercise.save();
    return res.status(201).json(saved.toObject());
  } catch (err) {
    console.error('createCustomExercise error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// List custom exercises for the logged-in user
exports.getCustomExercises = async (req, res) => {
  try {
    const exercises = await ExerciseCustom.find({ userId: req.user.id }).lean();
    return res.json(exercises);
  } catch (err) {
    console.error('getCustomExercises error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update a custom exercise
exports.updateCustomExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, caloriesPerMinute, caloriesPerRep, intensity, notes, tags } = req.body;

    const exercise = await ExerciseCustom.findOne({ _id: id, userId: req.user.id });
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    if (name) exercise.name = name;
    if (type) {
      if (!['continuous', 'discrete'].includes(type)) {
        return res.status(400).json({ message: 'Invalid type' });
      }
      exercise.type = type;
    }
    if (caloriesPerMinute !== undefined) exercise.caloriesPerMinute = caloriesPerMinute;
    if (caloriesPerRep !== undefined) exercise.caloriesPerRep = caloriesPerRep;
    if (intensity) exercise.intensity = intensity;
    if (notes !== undefined) exercise.notes = notes;
    if (tags !== undefined) exercise.tags = tags;

    const saved = await exercise.save();
    return res.json(saved.toObject());
  } catch (err) {
    console.error('updateCustomExercise error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete a custom exercise
exports.deleteCustomExercise = async (req, res) => {
  try {
    const { id } = req.params;
    const exercise = await ExerciseCustom.findOne({ _id: id, userId: req.user.id });
    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    await exercise.deleteOne();
    return res.json({ message: 'Exercise deleted successfully' });
  } catch (err) {
    console.error('deleteCustomExercise error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Add an exercise log (for either predefined or custom exercise)
exports.addExerciseLog = async (req, res) => {
  try {
    const { exerciseId, exerciseModel, day, date, duration, reps } = req.body;

    if (!exerciseId || !exerciseModel || !day || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!['ExercisePredefined', 'ExerciseCustom'].includes(exerciseModel)) {
      return res.status(400).json({ message: 'Invalid exerciseModel' });
    }

    if (!['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(day)) {
      return res.status(400).json({ message: 'Invalid day' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid date format, expected YYYY-MM-DD' });
    }

    // Ensure the referenced exercise exists
    let referencedExercise = null;
    if (exerciseModel === 'ExercisePredefined') {
      referencedExercise = await ExercisePredefined.findById(exerciseId).lean();
    } else {
      referencedExercise = await ExerciseCustom.findById(exerciseId).lean();
      // Verify it belongs to the user
      if (referencedExercise && referencedExercise.userId.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (!referencedExercise) {
      return res.status(400).json({ message: 'Referenced exercise not found' });
    }

    // Validate duration/reps based on exercise type
    if (referencedExercise.type === 'continuous') {
      if (!duration || duration <= 0) {
        return res.status(400).json({ message: 'Duration is required for continuous exercises' });
      }
      if (reps !== null && reps !== undefined) {
        return res.status(400).json({ message: 'Reps should not be provided for continuous exercises' });
      }
    } else {
      if (!reps || reps <= 0) {
        return res.status(400).json({ message: 'Reps is required for discrete exercises' });
      }
      if (duration !== null && duration !== undefined) {
        return res.status(400).json({ message: 'Duration should not be provided for discrete exercises' });
      }
    }

    const weekStart = getWeekStart(date);

    // Check if exercise already exists for this day/week
    const existingLog = await ExerciseLog.findOne({
      userId: req.user.id,
      exerciseId,
      day,
      weekStart,
    }).populate('exerciseId');

    if (existingLog) {
      // Exercise already exists, increment duration/reps
      const exercise = existingLog.exerciseId || referencedExercise;
      let newDuration = existingLog.duration;
      let newReps = existingLog.reps;
      let additionalCalories = 0;

      if (exercise.type === 'continuous') {
        newDuration = (existingLog.duration || 0) + duration;
        additionalCalories = Math.round((referencedExercise.caloriesPerMinute * duration) * 10) / 10;
        existingLog.duration = newDuration;
      } else {
        newReps = (existingLog.reps || 0) + reps;
        additionalCalories = Math.round((referencedExercise.caloriesPerRep * reps) * 10) / 10;
        existingLog.reps = newReps;
      }

      existingLog.caloriesBurned = Math.round((existingLog.caloriesBurned + additionalCalories) * 10) / 10;
      const saved = await existingLog.save();
      
      // Update goal progress for calories_burned goals
      goalController.updateProgressForGoalType(req.user.id, 'calories_burned').catch(err => {
        console.error('Error updating calories_burned goal progress:', err);
      });
      
      return res.status(200).json({ ...saved.toObject(), wasIncremented: true });
    }

    // Calculate calories burned for new entry
    let caloriesBurned = 0;
    if (referencedExercise.type === 'continuous') {
      caloriesBurned = Math.round((referencedExercise.caloriesPerMinute * duration) * 10) / 10;
    } else {
      caloriesBurned = Math.round((referencedExercise.caloriesPerRep * reps) * 10) / 10;
    }

    const log = new ExerciseLog({
      userId: req.user.id,
      exerciseId,
      exerciseModel,
      day,
      weekStart,
      duration: referencedExercise.type === 'continuous' ? duration : null,
      reps: referencedExercise.type === 'discrete' ? reps : null,
      caloriesBurned,
    });

    const saved = await log.save();
    
    // Update goal progress for calories_burned goals
    goalController.updateProgressForGoalType(req.user.id, 'calories_burned').catch(err => {
      console.error('Error updating calories_burned goal progress:', err);
    });
    
    return res.status(201).json({ ...saved.toObject(), wasIncremented: false });
  } catch (err) {
    // Duplicate key error from unique index (shouldn't happen now, but keep as fallback)
    if (err && err.code === 11000) {
      // Try to find and increment instead
      try {
        const weekStart = getWeekStart(req.body.date);
        const existingLog = await ExerciseLog.findOne({
          userId: req.user.id,
          exerciseId: req.body.exerciseId,
          day: req.body.day,
          weekStart,
        }).populate('exerciseId');
        
        if (existingLog) {
          const exercise = existingLog.exerciseId;
          if (exercise.type === 'continuous') {
            existingLog.duration = (existingLog.duration || 0) + (req.body.duration || 0);
            existingLog.caloriesBurned = Math.round((existingLog.caloriesBurned + (exercise.caloriesPerMinute * req.body.duration)) * 10) / 10;
          } else {
            existingLog.reps = (existingLog.reps || 0) + (req.body.reps || 0);
            existingLog.caloriesBurned = Math.round((existingLog.caloriesBurned + (exercise.caloriesPerRep * req.body.reps)) * 10) / 10;
          }
          const saved = await existingLog.save();
          return res.status(200).json({ ...saved.toObject(), wasIncremented: true });
        }
      } catch (retryErr) {
        console.error('Retry increment error:', retryErr);
      }
      return res.status(400).json({ message: 'Exercise already logged for this user/day/week' });
    }
    console.error('addExerciseLog error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get exercise logs for a user for a specific week (grouped by day)
exports.getExerciseLogsByWeek = async (req, res) => {
  try {
    const { weekStart, date } = req.query;
    let target = weekStart;
    
    if (!target && date) {
      target = getWeekStart(date);
    }
    
    if (!target || !/^\d{4}-\d{2}-\d{2}$/.test(target)) {
      return res.status(400).json({ message: 'Invalid or missing weekStart/date parameter (YYYY-MM-DD)' });
    }

    // Populate the referenced exercise (predefined or custom)
    const logs = await ExerciseLog.find({ userId: req.user.id, weekStart: target })
      .populate('exerciseId')
      .lean()
      .sort({ day: 1, createdAt: 1 });

    // Group by day
    const grouped = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    };

    logs.forEach((log) => {
      if (grouped[log.day]) {
        grouped[log.day].push(log);
      }
    });

    return res.json({ weekStart: target, activities: grouped });
  } catch (err) {
    console.error('getExerciseLogsByWeek error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update an exercise log
exports.updateExerciseLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { duration, reps } = req.body;

    const log = await ExerciseLog.findOne({ _id: id, userId: req.user.id }).populate('exerciseId');
    if (!log) {
      return res.status(404).json({ message: 'Exercise log not found' });
    }

    const exercise = log.exerciseId;
    if (!exercise) {
      return res.status(400).json({ message: 'Referenced exercise not found' });
    }

    // Update duration or reps based on exercise type
    let newCaloriesBurned = log.caloriesBurned;
    if (exercise.type === 'continuous') {
      if (duration !== undefined && duration !== null) {
        if (duration <= 0) {
          return res.status(400).json({ message: 'Duration must be greater than 0' });
        }
        log.duration = duration;
        newCaloriesBurned = Math.round((exercise.caloriesPerMinute * duration) * 10) / 10;
      }
    } else {
      if (reps !== undefined && reps !== null) {
        if (reps <= 0) {
          return res.status(400).json({ message: 'Reps must be greater than 0' });
        }
        log.reps = reps;
        newCaloriesBurned = Math.round((exercise.caloriesPerRep * reps) * 10) / 10;
      }
    }

    log.caloriesBurned = newCaloriesBurned;
    const saved = await log.save();

    return res.json(saved.toObject());
  } catch (err) {
    console.error('updateExerciseLog error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Delete an exercise log
exports.deleteExerciseLog = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await ExerciseLog.findOne({ _id: id, userId: req.user.id });
    if (!log) {
      return res.status(404).json({ message: 'Exercise log not found' });
    }

    await log.deleteOne();
    return res.json({ message: 'Exercise log deleted successfully' });
  } catch (err) {
    console.error('deleteExerciseLog error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


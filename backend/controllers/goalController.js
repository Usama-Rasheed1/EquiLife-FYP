const Goal = require('../models/Goal');
const User = require('../models/User');
const AssessmentResult = require('../models/AssessmentResult');
const DailyLog = require('../models/DailyLog');
const predefinedGoals = require('../data/predefinedGoals');

// Helper function to calculate target value based on goal type and base value
function calculateTargetValue(goalType, baseValue, improvementDirection) {
  if (goalType === 'weight') {
    // 10% increase or decrease
    if (improvementDirection === 'increase') {
      return baseValue * 1.1;
    } else {
      return baseValue * 0.9;
    }
  } else if (['gad7', 'phq9', 'ghq12'].includes(goalType)) {
    // 30% improvement (decrease for mental health)
    return Math.max(0, baseValue * 0.7);
  } else if (goalType === 'protein') {
    // For protein, target is typically 20% increase
    return baseValue * 1.2;
  } else if (goalType === 'calories_burned') {
    // For calories burned, target is typically 20% increase
    return baseValue * 1.2;
  }
  return baseValue;
}

// Helper function to get current value for a goal type
async function getCurrentValue(userId, goalType) {
  if (goalType === 'weight') {
    const user = await User.findById(userId).select('weightKg');
    return user?.weightKg || null;
  } else if (goalType === 'gad7') {
    const assessment = await AssessmentResult.findOne({ userId, assessmentName: 'GAD-7' })
      .sort({ createdAt: -1 })
      .lean();
    return assessment?.totalScore || null;
  } else if (goalType === 'phq9') {
    const assessment = await AssessmentResult.findOne({ userId, assessmentName: 'PHQ-9' })
      .sort({ createdAt: -1 })
      .lean();
    return assessment?.totalScore || null;
  } else if (goalType === 'ghq12') {
    const assessment = await AssessmentResult.findOne({ userId, assessmentName: 'GHQ-12' })
      .sort({ createdAt: -1 })
      .lean();
    return assessment?.totalScore || null;
  } else if (goalType === 'protein') {
    const dailyLogs = await DailyLog.find({ userId })
      .sort({ date: -1 })
      .limit(7)
      .lean();
    if (dailyLogs.length > 0) {
      const totalProtein = dailyLogs.reduce((sum, log) => sum + (log.totalProtein || 0), 0);
      return totalProtein / dailyLogs.length;
    }
    return null;
  } else if (goalType === 'calories_burned') {
    const dailyLogs = await DailyLog.find({ userId })
      .sort({ date: -1 })
      .limit(7)
      .lean();
    if (dailyLogs.length > 0) {
      const totalCalories = dailyLogs.reduce((sum, log) => sum + (log.totalCaloriesBurned || 0), 0);
      return totalCalories;
    }
    return null;
  }
  return null;
}

// Helper function to check if required base value exists
async function hasRequiredBaseValue(userId, goalType) {
  const currentValue = await getCurrentValue(userId, goalType);
  return currentValue !== null && currentValue !== undefined;
}

// Map goal type to goal definition
function getGoalDefinition(goalType) {
  const goalDefinitions = {
    'weight': {
      title: 'Weight Goal',
      description: 'Achieve your weight target',
      metric: 'Weight (kg)',
      improvementDirection: 'decrease' // Default, can be changed
    },
    'gad7': {
      title: 'Control Anxiety',
      description: 'Reduce anxiety levels based on GAD-7 assessment scores',
      metric: 'GAD-7',
      improvementDirection: 'decrease'
    },
    'phq9': {
      title: 'Reduce Depression',
      description: 'Improve mood based on PHQ-9 assessment scores',
      metric: 'PHQ-9',
      improvementDirection: 'decrease'
    },
    'ghq12': {
      title: 'Improve General Mental Health',
      description: 'Enhance overall wellbeing based on GHQ-12 scores',
      metric: 'GHQ-12',
      improvementDirection: 'decrease'
    },
    'protein': {
      title: 'Build Muscle',
      description: 'Gain muscle mass through increased protein intake',
      metric: 'Protein Intake (g)',
      improvementDirection: 'increase'
    },
    'calories_burned': {
      title: 'Improve Daily Activity',
      description: 'Increase weekly calories burned through regular exercise',
      metric: 'Weekly Calories Burned',
      improvementDirection: 'increase'
    }
  };
  return goalDefinitions[goalType];
}

// Start a new goal
exports.startGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalType, improvementDirection } = req.body;

    // Validate goal type exists in predefined goals
    const predefinedGoal = predefinedGoals.find(g => g.goalType === goalType);
    if (!predefinedGoal) {
      return res.status(400).json({ message: 'Invalid goal type' });
    }

    // Check if required base value exists
    const hasBaseValue = await hasRequiredBaseValue(userId, goalType);
    if (!hasBaseValue) {
      return res.status(400).json({ 
        message: 'Please add or update your weight, assessments, nutrition, or activity values to accurately start and track your goals.' 
      });
    }

    // Check if user already has an active goal of this type
    const existingActiveGoal = await Goal.findOne({
      userId,
      goalType,
      status: { $in: ['in_progress', 'almost_done', 'not_started'] }
    });

    if (existingActiveGoal) {
      return res.status(400).json({ message: 'You already have an active goal of this type' });
    }

    // Get current value as base value
    const baseValue = await getCurrentValue(userId, goalType);
    if (baseValue === null || baseValue === undefined) {
      return res.status(400).json({ 
        message: 'Required base value not found. Please update your data first.' 
      });
    }

    // Determine improvement direction (use provided or from predefined)
    const dir = improvementDirection || predefinedGoal.improvementDirection;
    
    // Calculate target value
    const targetValue = calculateTargetValue(goalType, baseValue, dir);

    // Create goal
    const goal = new Goal({
      userId,
      goalType,
      title: predefinedGoal.title,
      description: predefinedGoal.description,
      metric: predefinedGoal.metric,
      improvementDirection: dir,
      baseValue,
      targetValue,
      currentValue: baseValue,
      progress: 0,
      status: 'in_progress',
      activatedAt: new Date()
    });

    await goal.save();

    return res.status(201).json({ goal });
  } catch (err) {
    console.error('Start goal error:', err);
    return res.status(500).json({ message: 'Error starting goal' });
  }
};

// Get all goals for a user
exports.getGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const goals = await Goal.find({ userId }).sort({ activatedAt: -1 });
    return res.json({ goals });
  } catch (err) {
    console.error('Get goals error:', err);
    return res.status(500).json({ message: 'Error fetching goals' });
  }
};

// Update progress for a specific goal
exports.updateGoalProgress = async (goalId) => {
  try {
    const goal = await Goal.findById(goalId);
    if (!goal) return;

    const currentValue = await getCurrentValue(goal.userId, goal.goalType);
    if (currentValue === null || currentValue === undefined) return;

    goal.currentValue = currentValue;
    goal.updateProgress();
    await goal.save();
  } catch (err) {
    console.error('Update goal progress error:', err);
  }
};

// Update progress for all active goals of a specific type
exports.updateProgressForGoalType = async (userId, goalType) => {
  try {
    const goals = await Goal.find({
      userId,
      goalType,
      status: { $in: ['in_progress', 'almost_done', 'not_started'] }
    });

    for (const goal of goals) {
      await exports.updateGoalProgress(goal._id);
    }
  } catch (err) {
    console.error('Update progress for goal type error:', err);
  }
};

// Restart a completed goal
exports.restartGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalId } = req.params;

    const goal = await Goal.findOne({ _id: goalId, userId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    if (goal.status !== 'completed') {
      return res.status(400).json({ message: 'Only completed goals can be restarted' });
    }

    // Check if required base value exists
    const hasBaseValue = await hasRequiredBaseValue(userId, goal.goalType);
    if (!hasBaseValue) {
      return res.status(400).json({ 
        message: 'Please add or update your weight, assessments, nutrition, or activity values to accurately start and track your goals.' 
      });
    }

    // Get new base value
    const newBaseValue = await getCurrentValue(userId, goal.goalType);
    if (newBaseValue === null || newBaseValue === undefined) {
      return res.status(400).json({ 
        message: 'Required base value not found. Please update your data first.' 
      });
    }

    // Calculate new target value
    const newTargetValue = calculateTargetValue(goal.goalType, newBaseValue, goal.improvementDirection);

    // Update goal
    goal.previousCompletionAt = goal.completedAt;
    goal.baseValue = newBaseValue;
    goal.targetValue = newTargetValue;
    goal.currentValue = newBaseValue;
    goal.progress = 0;
    goal.status = 'in_progress';
    goal.completedAt = null;
    goal.isRestarted = true;
    goal.activatedAt = new Date();

    await goal.save();

    return res.json({ goal });
  } catch (err) {
    console.error('Restart goal error:', err);
    return res.status(500).json({ message: 'Error restarting goal' });
  }
};

// Get available goal types and their base value status
exports.getAvailableGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Map predefined goals and check their status
    const goalsWithStatus = await Promise.all(
      predefinedGoals.map(async (goal) => {
        const hasBaseValue = await hasRequiredBaseValue(userId, goal.goalType);
        const hasActiveGoal = await Goal.exists({
          userId,
          goalType: goal.goalType,
          status: { $in: ['in_progress', 'almost_done', 'not_started'] }
        });
        
        return {
          ...goal,
          hasBaseValue,
          hasActiveGoal,
          canStart: hasBaseValue && !hasActiveGoal
        };
      })
    );

    return res.json({ availableGoals: goalsWithStatus });
  } catch (err) {
    console.error('Get available goals error:', err);
    return res.status(500).json({ message: 'Error fetching available goals' });
  }
};

// Get latest assessment scores for goal tracking
exports.getLatestAssessments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [gad7, phq9, ghq12] = await Promise.all([
      AssessmentResult.findOne({ userId, assessmentName: 'GAD-7' })
        .sort({ createdAt: -1 })
        .select('totalScore severityLabel createdAt')
        .lean(),
      AssessmentResult.findOne({ userId, assessmentName: 'PHQ-9' })
        .sort({ createdAt: -1 })
        .select('totalScore severityLabel createdAt')
        .lean(),
      AssessmentResult.findOne({ userId, assessmentName: 'GHQ-12' })
        .sort({ createdAt: -1 })
        .select('totalScore severityLabel createdAt')
        .lean()
    ]);

    return res.json({
      latestAssessments: {
        gad7: gad7 ? { score: gad7.totalScore, severity: gad7.severityLabel, date: gad7.createdAt } : null,
        phq9: phq9 ? { score: phq9.totalScore, severity: phq9.severityLabel, date: phq9.createdAt } : null,
        ghq12: ghq12 ? { score: ghq12.totalScore, severity: ghq12.severityLabel, date: ghq12.createdAt } : null
      }
    });
  } catch (err) {
    console.error('Get latest assessments error:', err);
    return res.status(500).json({ message: 'Error fetching latest assessments' });
  }
};

// End/Delete a goal
exports.endGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { goalId } = req.params;

    const goal = await Goal.findOne({ _id: goalId, userId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    await Goal.findByIdAndDelete(goalId);
    return res.json({ message: 'Goal ended successfully' });
  } catch (err) {
    console.error('End goal error:', err);
    return res.status(500).json({ message: 'Error ending goal' });
  }
};


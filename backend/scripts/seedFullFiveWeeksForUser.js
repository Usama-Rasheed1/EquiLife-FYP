/**
 * Seed Script: Create a comprehensive 5-week dataset for one user.
 * - Creates DailyLog entries (calories/macros) for each day across 5 weeks
 * - Creates Diet documents (breakfast/lunch/dinner totals)
 * - Creates ExerciseLog entries (calories burned per day)
 * - Creates AssessmentResult and AssessmentAttempt for GAD-7, PHQ-9, GHQ-12 once per week
 * - Creates WeeklyAssessmentSummary for weeks 1..5
 * - Creates a Goal and a Gamification document for the user
 *
 * Usage from backend folder:
 *   node scripts/seedFullFiveWeeksForUser.js
 * Set env MONGO_URI to target DB. Use SEED_USER_EMAIL or SEED_USER_ID to pick user.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const DailyLog = require('../models/DailyLog');
const Diet = require('../models/Diet');
const ExerciseLog = require('../models/ExerciseLog');
const AssessmentResult = require('../models/AssessmentResult');
const AssessmentAttempt = require('../models/AssessmentAttempt');
const WeeklyAssessmentSummary = require('../models/WeeklyAssessmentSummary');
const Goal = require('../models/Goal');
const Gamification = require('../models/Gamification');
const Assessment = require('../models/Assessment');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fyp-equilife';

function dateToYMD(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function connect() {
  // Note: modern MongoDB driver ignores useNewUrlParser/useUnifiedTopology options
  await mongoose.connect(mongoUri);
}
    
async function findUser() {
  const seedUserId = process.env.SEED_USER_ID;
  const seedEmail = ('usamara760@gmail.com').trim().toLowerCase();
  let user = null;
  if (seedUserId) user = await User.findById(seedUserId).lean();
  if (!user && seedEmail) user = await User.findOne({ email: seedEmail }).lean();
  if (!user) user = await User.findOne().lean();
  if (!user) throw new Error('No user found to seed');
  return user;
}

// Simple macros generator
function makesimpleMealsForDate() {
  const bk = { description: JSON.stringify([{ name: 'Egg', calories: 80, quantity: 1 }]), carbs: 10, fats: 8, protein: 6 };
  const lu = { description: JSON.stringify([{ name: 'Rice', calories: 250, quantity: 1 }]), carbs: 50, fats: 4, protein: 8 };
  const dn = { description: JSON.stringify([{ name: 'Chicken', calories: 300, quantity: 1 }]), carbs: 5, fats: 10, protein: 35 };
  const totals = { carbs: bk.carbs + lu.carbs + dn.carbs, fats: bk.fats + lu.fats + dn.fats, protein: bk.protein + lu.protein + dn.protein };
  return { breakfast: bk, lunch: lu, dinner: dn, totals };
}

async function upsertDailyAndDiet(user, targetDate, caloriesBurned = 200) {
  const ymd = dateToYMD(targetDate);
  const macros = makesimpleMealsForDate();
  // Upsert DailyLog
  await DailyLog.findOneAndUpdate({ userId: user._id, date: ymd }, {
    userId: user._id,
    date: ymd,
    totalCalories: macros.totals.carbs * 4 + macros.totals.fats * 9 + macros.totals.protein * 4,
    totalProtein: macros.totals.protein,
    totalCarbs: macros.totals.carbs,
    totalFat: macros.totals.fats,
    totalCaloriesBurned: caloriesBurned
  }, { upsert: true, new: true, setDefaultsOnInsert: true });

  // Upsert Diet
  await Diet.findOneAndUpdate({ user: user._id, date: targetDate }, {
    user: user._id,
    date: targetDate,
    breakfast: macros.breakfast,
    lunch: macros.lunch,
    dinner: macros.dinner,
    totals: macros.totals
  }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

// Create ExerciseLog for the day
async function upsertExercise(user, targetDate, dayName, weekStartStr, caloriesBurned) {
  // Use a freshly-created ObjectId but make sure to call with `new` to avoid runtime errors
  const exId = new mongoose.Types.ObjectId();
  await ExerciseLog.findOneAndUpdate({ userId: user._id, weekStart: weekStartStr, day: dayName, exerciseId: exId }, {
    userId: user._id,
    exerciseId: exId,
    exerciseModel: 'ExerciseCustom',
    day: dayName,
    weekStart: weekStartStr,
    duration: 30,
    caloriesBurned
  }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function seed() {
  try {
    await connect();
    const user = await findUser();
    console.log('Seeding data for user', user.email || user._id);

    // Prepare assessments
    const gad = await Assessment.findOne({ name: 'GAD-7' }).lean().catch(()=>null);
    const phq = await Assessment.findOne({ name: 'PHQ-9' }).lean().catch(()=>null);
    const ghq = await Assessment.findOne({ name: 'GHQ-12' }).lean().catch(()=>null);

    const now = new Date();
    // We'll seed weeks 1..5 where week 5 is the most recent week
    const totalWeeks = 5;
    const daysPerWeek = 7;
    const weeks = [];
    for (let w = 0; w < totalWeeks; w++) {
      // weekStart is Monday of the week
      const start = new Date(now.getTime() - (totalWeeks - 1 - w) * 7 * 24 * 3600 * 1000);
      start.setUTCHours(0,0,0,0);
      const dayOfWeek = start.getUTCDay();
      const daysToMonday = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
      start.setUTCDate(start.getUTCDate() - daysToMonday);
      weeks.push(start);
    }

    for (let wi = 0; wi < weeks.length; wi++) {
      const weekStart = weeks[wi];
      const weekNumber = wi + 1;
      const weekStartStr = dateToYMD(weekStart);

      // Create 7 days of DailyLog, Diet, Exercise
      for (let d = 0; d < daysPerWeek; d++) {
        const day = new Date(weekStart.getTime() + d * 24 * 3600 * 1000);
        const dayName = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][d];
        const caloriesBurned = 150 + (wi * 10) + d * 5; // vary over time
        await upsertDailyAndDiet(user, day, caloriesBurned);
        await upsertExercise(user, day, dayName, weekStartStr, caloriesBurned);
      }

      // Weekly assessment values (gradually improving)
      const gadScore = Math.max(0, 14 - wi * 2); // 14,12,10,8,6
      const phqScore = Math.max(0, 12 - wi * 2); // 12,10,8,6,4
      const ghqScore = Math.max(0, 10 - wi * 1); // 10,9,8,7,6

      // Compute takenAt as mid-week
      const takenAt = new Date(weekStart.getTime() + 3 * 24 * 3600 * 1000);

      // Upsert WeeklyAssessmentSummary
      await WeeklyAssessmentSummary.findOneAndUpdate({ userId: user._id, weekNumber }, {
        userId: user._id,
        weekNumber,
        weekStartDate: weekStart,
        gadScore,
        phqScore,
        ghqScore,
        lastUpdatedAt: new Date()
      }, { upsert: true, new: true, setDefaultsOnInsert: true });

      // Create AssessmentResult and Attempt for each assessment
      async function createAssessment(name, score, assessmentDoc) {
        if (!assessmentDoc) return;
        // create result
        await AssessmentResult.create({
          userId: user._id,
          assessmentId: assessmentDoc._id,
          assessmentName: name,
          totalScore: score,
          answers: {},
          severityLabel: (name === 'GAD-7' ? (score <=4 ? 'Minimal' : score<=9 ? 'Mild' : 'Moderate') : ''),
          createdAt: takenAt
        }).catch(()=>null);

        // create attempt
        const dayOfWeek = 4;
        await AssessmentAttempt.create({
          userId: user._id,
          assessmentType: name,
          score,
          severity: 'N/A',
          takenAt,
          weekStartDate: weekStart,
          dayOfWeek
        }).catch(()=>null);
      }

      await createAssessment('GAD-7', gadScore, gad);
      await createAssessment('PHQ-9', phqScore, phq);
      await createAssessment('GHQ-12', ghqScore, ghq);
    }

    // Create or update a simple weight goal for the user
    await Goal.findOneAndUpdate({ userId: user._id, goalType: 'weight' }, {
      userId: user._id,
      goalType: 'weight',
      title: 'Lose 2 kg',
      description: '5-week demo goal',
      metric: 'weightKg',
      improvementDirection: 'decrease',
      baseValue: user.weightKg || 80,
      targetValue: (user.weightKg || 80) - 2,
      currentValue: (user.weightKg || 80) - 1,
      progress: 50,
      status: 'in_progress'
    }, { upsert: true, new: true, setDefaultsOnInsert: true });

    // Create gamification profile
    await Gamification.findOneAndUpdate({ userId: user._id }, {
      userId: user._id,
      totalPoints: 1200,
      activeChallenges: [],
      completedChallenges: [],
      streak: { current: 7, longest: 14, lastActivity: new Date() }
    }, { upsert: true, new: true, setDefaultsOnInsert: true });

    console.log('Seeding complete for 5 weeks');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();

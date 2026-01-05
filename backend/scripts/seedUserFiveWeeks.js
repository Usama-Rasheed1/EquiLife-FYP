/**
 * Seed Script: Ensure a specific user has 5 weeks of WeeklyAssessmentSummary
 * Usage:
 *  - Provide either SEED_USER_ID or SEED_USER_EMAIL in env
 *  - Run from backend folder: `node scripts/seedUserFiveWeeks.js`
 *
 * This will upsert weeks 1..5 for the chosen user, preserving existing numeric
 * scores and setting missing weeks to null so the frontend line graph shows
 * a fixed 5-week window.
 */

const mongoose = require('mongoose');
const WeeklyAssessmentSummary = require('../models/WeeklyAssessmentSummary');
const User = require('../models/User');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fyp-equilife';

async function run() {
  try {
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const seedUserId = process.env.SEED_USER_ID;
    // Allow email via env, otherwise default to the common test email
    const seedEmailRaw =  "m.tayyab33600@gmail.com";
    const seedEmail = seedEmailRaw && seedEmailRaw.trim().toLowerCase();

    let user = null;
    if (seedUserId) {
      user = await User.findById(seedUserId).lean();
      if (!user) throw new Error(`No user found with id=${seedUserId}`);
      console.log('Using user id:', seedUserId);
    } else if (seedEmail) {
      // Try exact match first, then case-insensitive fallback
      user = await User.findOne({ email: seedEmail }).lean();
      if (!user) {
        user = await User.findOne({ email: { $regex: `^${seedEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, $options: 'i' } }).lean();
      }

      if (!user) {
        // Show a few user emails to help debugging (do not expose other PII in logs if sensitive)
        const sampleUsers = await User.find().limit(10).select('email').lean();
        console.error('Could not find user by email. Sample emails in DB:', sampleUsers.map(u => u.email));
        throw new Error(`No user found with email=${seedEmail}. Check MONGO_URI and that the email exists (case-insensitive).`);
      }

      console.log('Using user email:', user.email, 'id:', user._id);
    } else {
      // fallback: use first existing user
      user = await User.findOne().lean();
      if (!user) throw new Error('No users found in database. Create one first.');
      console.log('No SEED_USER_ID/EMAIL provided; using first user:', user._id, user.email);
    }

    const userId = user._id;

    // Example data; adjust as needed. Keep null explicitly for missing weeks.
    // If you want to preserve existing values in DB for a particular week, this script
    // will not overwrite numeric fields unless you pass overwrite=true via env.
    const overwrite = process.env.OVERWRITE === 'true';

    const desiredWeeks = [1,2,3,4,5,6];

    // Example sample values to seed; you can modify these or pass via env in future.
    // Populate numeric sample scores for all weeks by default
    // You can force certain weeks to be 'missed' (null) by setting SKIP_WEEKS env, e.g. SKIP_WEEKS="2,4"
    const defaultSamples = {
      1: { gadScore: 9, phqScore: 14, ghqScore: 10 },
      2: { gadScore: 8, phqScore: 12, ghqScore: 11 },
      3: { gadScore: 7, phqScore: 5, ghqScore: 11 },
      4: { gadScore: 6, phqScore: 8, ghqScore: 10 },
      5: { gadScore: 5, phqScore: 7, ghqScore: 9 },
      6: { gadScore: 10 , phqScore: 10, ghqScore: 10 },

    };

    // Parse SKIP_WEEKS env var (comma-separated list of week numbers to treat as missed)
    const skipWeeksRaw = process.env.SKIP_WEEKS || '';
    const skipWeeks = new Set(
      skipWeeksRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((n) => parseInt(n, 10))
        .filter((n) => !isNaN(n))
    );

    const sampleByWeek = {};
    for (let i = 1; i <= 6; i++) {
      if (skipWeeks.has(i)) {
        sampleByWeek[i] = { gadScore: null, phqScore: null, ghqScore: null };
      } else {
        sampleByWeek[i] = defaultSamples[i] || { gadScore: null, phqScore: null, ghqScore: null };
      }
    }

    // Preload assessment documents so we can reference assessmentId in AssessmentResult
    const gadAssessment = await require('../models/Assessment').findOne({ name: 'GAD-7' }).lean().catch(()=>null);
    const phqAssessment = await require('../models/Assessment').findOne({ name: 'PHQ-9' }).lean().catch(()=>null);
    const ghqAssessment = await require('../models/Assessment').findOne({ name: 'GHQ-12' }).lean().catch(()=>null);

    for (const wk of desiredWeeks) {
      // Compute stable, consistent weekStartDate based on the week number (not current date).
      // This ensures the same weekStartDate is used every time the script runs, preventing
      // duplicate documents and lost data.
      const now = new Date();
      const DAY_MS = 24 * 60 * 60 * 1000;
      const weeksFromLatest = desiredWeeks[desiredWeeks.length - 1] - wk; // e.g., for wk=6 -> 0
      // takenAt: middle of the target week
      const takenAt = new Date(now.getTime() - weeksFromLatest * 7 * DAY_MS + 2 * DAY_MS);
      // Compute a canonical weekStartDate (UTC midnight of the Monday of that week)
      const tmp = new Date(takenAt);
      tmp.setUTCHours(0, 0, 0, 0);
      // Align to the nearest Monday (start of week)
      const dayOfWeekNum = tmp.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
      const daysToMonday = (dayOfWeekNum === 0 ? 6 : dayOfWeekNum - 1);
      tmp.setUTCDate(tmp.getUTCDate() - daysToMonday);
      const weekStartDateForInsert = tmp;

      const toSet = sampleByWeek[wk] || { gadScore: null, phqScore: null, ghqScore: null };

      // Always upsert by weekNumber only (not by weekStartDate) to avoid creating multiple
      // documents for the same week when weekStartDate changes between script runs.
      const update = {
        $set: {
          gadScore: (toSet.gadScore === undefined ? null : toSet.gadScore),
          phqScore: (toSet.phqScore === undefined ? null : toSet.phqScore),
          ghqScore: (toSet.ghqScore === undefined ? null : toSet.ghqScore),
          weekStartDate: weekStartDateForInsert, // Always set weekStartDate in $set to keep it consistent
          lastUpdatedAt: new Date(),
          weekNumber: wk,
        },
        $setOnInsert: {
          userId,
        },
      };

      const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
      // Upsert by (userId, weekNumber) only. This ensures each week is stored once,
      // and weekStartDate is always kept up-to-date without creating duplicates.
      const res = await WeeklyAssessmentSummary.findOneAndUpdate(
        { userId, weekNumber: wk },
        update,
        opts
      );
      console.log(`Upserted Week ${wk}:`, { gadScore: res.gadScore, phqScore: res.phqScore, ghqScore: res.ghqScore });

      // Also create corresponding AssessmentResult and AssessmentAttempt entries for any numeric scores
      // use takenAt and weekStartDateForInsert computed above
      const dayOfWeek = ((takenAt.getUTCDay() + 6) % 7) + 1; // 1-7 (Mon=1)
      const weekStartDate = weekStartDateForInsert;

      // Helper to upsert result/attempt for one assessment type
      async function upsertAssessmentRecords(assessmentName, score, assessmentDoc) {
        if (score === null || score === undefined) return;
        if (!assessmentDoc) {
          console.warn(`Skipping ${assessmentName} result: Assessment document not found`);
          return;
        }

        // Check existing AssessmentResult in the week window
        const weekStart = new Date(weekStartDate);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

        const existingResult = await require('../models/AssessmentResult').findOne({
          userId,
          assessmentName,
          createdAt: { $gte: weekStart, $lte: weekEnd },
        }).lean().catch(()=>null);
        // Precompute severity label for use in both Result and Attempt upserts
        const severityMap = {
          'GAD-7': (s) => (s <= 4 ? 'Minimal' : s <= 9 ? 'Mild' : s <= 14 ? 'Moderate' : 'Severe'),
          'PHQ-9': (s) => (s <= 4 ? 'Minimal' : s <= 9 ? 'Mild' : s <= 14 ? 'Moderate' : s <= 19 ? 'Moderately Severe' : 'Severe'),
          'GHQ-12': (s) => (s <= 12 ? 'Low' : s <= 20 ? 'Moderate' : 'High'),
        };

        const severityLabel = (severityMap[assessmentName] && severityMap[assessmentName](score)) || 'Unknown';

        if (existingResult && !overwrite) {
          console.log(`${assessmentName} AssessmentResult exists for week ${wk} — skipping`);
        } else {
          // Upsert AssessmentResult
          if (existingResult && overwrite) {
            await require('../models/AssessmentResult').findByIdAndUpdate(existingResult._id, {
              totalScore: score,
              severityLabel,
              updatedAt: new Date(),
            });
            console.log(`Updated AssessmentResult for ${assessmentName} week ${wk}`);
          } else {
            await require('../models/AssessmentResult').create({
              userId,
              assessmentId: assessmentDoc._id,
              assessmentName,
              totalScore: score,
              answers: {},
              severityLabel,
              createdAt: takenAt,
            });
            console.log(`Created AssessmentResult for ${assessmentName} week ${wk}`);
          }
        }

        // Upsert AssessmentAttempt (daily tracking)
        const existingAttempt = await require('../models/AssessmentAttempt').findOne({
          userId,
          assessmentType: assessmentName,
          weekStartDate: weekStart,
        }).lean().catch(()=>null);

        if (existingAttempt && !overwrite) {
          console.log(`${assessmentName} AssessmentAttempt exists for week ${wk} — skipping`);
        } else if (existingAttempt && overwrite) {
          await require('../models/AssessmentAttempt').findByIdAndUpdate(existingAttempt._id, {
            score,
            severity: severityLabel,
            takenAt,
            dayOfWeek,
            weekStartDate: weekStart,
            updatedAt: new Date(),
          });
          console.log(`Updated AssessmentAttempt for ${assessmentName} week ${wk}`);
        } else {
          await require('../models/AssessmentAttempt').create({
            userId,
            assessmentType: assessmentName,
            score,
            severity: severityLabel,
            takenAt,
            weekStartDate: weekStart,
            dayOfWeek,
          });
          console.log(`Created AssessmentAttempt for ${assessmentName} week ${wk}`);
        }
      }

      // Create records for each assessment type if numeric
      await upsertAssessmentRecords('GAD-7', res.gadScore, gadAssessment);
      await upsertAssessmentRecords('PHQ-9', res.phqScore, phqAssessment);
      await upsertAssessmentRecords('GHQ-12', res.ghqScore, ghqAssessment);
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

run();

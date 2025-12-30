<<<<<<< HEAD
const Assessment = require("../models/Assessment");
const AssessmentResult = require("../models/AssessmentResult");
const AssessmentAttempt = require("../models/AssessmentAttempt");
const WeeklyAssessmentSummary = require("../models/WeeklyAssessmentSummary");
const {
  getWeekStartDate,
  getDayOfWeek,
  hasAssessmentToday,
  getLastNWeekStarts,
} = require("../utils/dateUtils");

/**
 * Helper: Map total score to severity label
 * Based on official scoring guidelines for each assessment
 */
const mapScoreToSeverity = (assessmentName, totalScore) => {
  if (assessmentName === "GAD-7") {
    if (totalScore <= 4) return "Minimal";
    if (totalScore <= 9) return "Mild";
    if (totalScore <= 14) return "Moderate";
    return "Severe";
  }

  if (assessmentName === "PHQ-9") {
    if (totalScore <= 4) return "Minimal";
    if (totalScore <= 9) return "Mild";
    if (totalScore <= 14) return "Moderate";
    if (totalScore <= 19) return "Moderately Severe";
    return "Severe";
  }

  if (assessmentName === "GHQ-12") {
    if (totalScore <= 12) return "Low";
    if (totalScore <= 20) return "Moderate";
    return "High";
  }

  return "Unknown";
};

/**
 * Get all assessments (without detailed questions for list view)
 */
exports.getAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find()
      .select("name shortName description scoringType totalQuestions")
      .sort("createdAt");

    return res.json({
      ok: true,
      assessments,
    });
  } catch (err) {
    console.error("Get assessments error:", err);
    return res.status(500).json({ ok: false, message: "Error fetching assessments" });
  }
};

/**
 * Get single assessment with all questions and options
 */
exports.getAssessmentQuestions = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ ok: false, message: "Assessment not found" });
    }

    return res.json({
      ok: true,
      assessment: {
        _id: assessment._id,
        name: assessment.name,
        shortName: assessment.shortName,
        description: assessment.description,
        scoringType: assessment.scoringType,
        totalQuestions: assessment.totalQuestions,
        questions: assessment.questions, // Array of questions with embedded options
      },
    });
  } catch (err) {
    console.error("Get assessment questions error:", err);
    return res.status(500).json({ ok: false, message: "Error fetching questions" });
  }
};

/**
 * Submit assessment answers and calculate score
 * Expects: { answers: { [questionIndex]: selectedOptionIndex } }
 * 
 * Triggers:
 * 1. Check one-per-day constraint
 * 2. Create AssessmentAttempt record
 * 3. Update or create WeeklyAssessmentSummary
 */
exports.submitAssessment = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const { assessmentId } = req.params;
    const { answers } = req.body; // answers[questionIndex] = selectedOptionIndex

    if (!answers || typeof answers !== "object") {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid answers format" });
    }

    // Fetch assessment
    const assessment = await Assessment.findById(assessmentId);
    if (!assessment) {
      return res.status(404).json({ ok: false, message: "Assessment not found" });
    }

    // ============ DAILY CONSTRAINT CHECK ============
    const alreadyTaken = await hasAssessmentToday(
      userId,
      assessment.name,
      AssessmentAttempt
    );
    if (alreadyTaken) {
      return res.status(409).json({
        ok: false,
        message: `You have already taken the ${assessment.name} assessment today. Please try again tomorrow.`,
      });
    }

    // Calculate total score using option weights
    let totalScore = 0;
    const answerWeights = {};

    // Validate answers and calculate score
    for (const [questionIndexStr, optionIndex] of Object.entries(answers)) {
      const questionIndex = parseInt(questionIndexStr);

      if (questionIndex < 0 || questionIndex >= assessment.questions.length) {
        return res
          .status(400)
          .json({ ok: false, message: "Invalid question index" });
      }

      const question = assessment.questions[questionIndex];
      if (optionIndex < 0 || optionIndex >= question.options.length) {
        return res
          .status(400)
          .json({ ok: false, message: "Invalid option index" });
      }

      const selectedOption = question.options[optionIndex];
      const weight = selectedOption.weight;
      totalScore += weight;
      answerWeights[questionIndex] = weight;
    }

    // Map score to severity
    const severityLabel = mapScoreToSeverity(assessment.name, totalScore);

    // ============ SAVE LEGACY RESULT ============
    const result = await AssessmentResult.create({
      userId,
      assessmentId: assessment._id,
      assessmentName: assessment.name,
      totalScore,
      answers: answerWeights,
      severityLabel,
    });

    // ============ SAVE DAILY ATTEMPT ============
    const now = new Date();
    const weekStartDate = getWeekStartDate(now);
    const dayOfWeek = getDayOfWeek(now);

    const attempt = await AssessmentAttempt.create({
      userId,
      assessmentType: assessment.name,
      score: totalScore,
      severity: severityLabel,
      takenAt: now,
      weekStartDate,
      dayOfWeek,
    });

    // ============ UPDATE WEEKLY SUMMARY ============
    // Determine which array field to update based on assessment type
    let updateField;
    if (assessment.name === "GAD-7") {
      updateField = "gadScores";
    } else if (assessment.name === "PHQ-9") {
      updateField = "phqScores";
    } else if (assessment.name === "GHQ-12") {
      updateField = "ghqScores";
    }

    // Build the update object: update specific day index
    const updateObj = {};
    updateObj[`${updateField}.${dayOfWeek - 1}`] = totalScore; // dayOfWeek is 1–7, array is 0–6

    // Upsert: create if not exists, update if exists
    await WeeklyAssessmentSummary.findOneAndUpdate(
      { userId, weekStartDate },
      {
        $set: updateObj,
        $setOnInsert: {
          userId,
          weekStartDate,
        },
      },
      { upsert: true, new: true }
    );

    return res.json({
      ok: true,
      result: {
        _id: result._id,
        totalScore: result.totalScore,
        severityLabel: result.severityLabel,
        assessmentName: result.assessmentName,
        createdAt: result.createdAt,
      },
    });
  } catch (err) {
    console.error("Submit assessment error:", err);
    return res.status(500).json({ ok: false, message: "Error submitting assessment" });
  }
};

/**
 * Get user's assessment history
 */
exports.getUserAssessmentHistory = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const results = await AssessmentResult.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      results,
    });
  } catch (err) {
    console.error("Get history error:", err);
    return res.status(500).json({ ok: false, message: "Error fetching history" });
  }
};

/**
 * Get latest score for each assessment type for current user
 */
exports.getLatestScores = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const gad7 = await AssessmentResult.findOne({
      userId,
      assessmentName: "GAD-7",
    })
      .sort({ createdAt: -1 })
      .lean();

    const phq9 = await AssessmentResult.findOne({
      userId,
      assessmentName: "PHQ-9",
    })
      .sort({ createdAt: -1 })
      .lean();

    const ghq12 = await AssessmentResult.findOne({
      userId,
      assessmentName: "GHQ-12",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      ok: true,
      latestScores: {
        anxiety: gad7 || null,
        depression: phq9 || null,
        wellbeing: ghq12 || null,
      },
    });
  } catch (err) {
    console.error("Get latest scores error:", err);
    return res.status(500).json({ ok: false, message: "Error fetching latest scores" });
  }
};

/**
 * Get weekly assessment trends for last N weeks
 * Query param: weeks (default 5)
 * 
 * Returns: Array of weekly summaries sorted by week (most recent first)
 * Each summary contains gadScores, phqScores, ghqScores (7-element arrays with nulls)
 */
exports.getWeeklyTrends = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    // Get number of weeks from query (default 5)
    const weeks = Math.min(parseInt(req.query.weeks || "5"), 52); // Cap at 1 year

    // Get list of week start dates to query
    const weekStarts = getLastNWeekStarts(weeks);

    // Fetch weekly summaries for all these weeks
    const summaries = await WeeklyAssessmentSummary.find({
      userId,
      weekStartDate: { $in: weekStarts },
    })
      .sort({ weekStartDate: -1 })
      .lean();

    // Map summaries by weekStartDate for quick lookup
    const summariesMap = {};
    summaries.forEach((s) => {
      summariesMap[s.weekStartDate.getTime()] = s;
    });

    // Build result: ensure all weeks are present in order (fill gaps with nulls)
    const result = weekStarts.map((weekStart) => {
      const existing = summariesMap[weekStart.getTime()];
      return (
        existing || {
          userId,
          weekStartDate: weekStart,
          gadScores: [null, null, null, null, null, null, null],
          phqScores: [null, null, null, null, null, null, null],
          ghqScores: [null, null, null, null, null, null, null],
        }
      );
    });

    return res.json({
      ok: true,
      weeklyTrends: result,
    });
  } catch (err) {
    console.error("Get weekly trends error:", err);
    return res.status(500).json({ ok: false, message: "Error fetching weekly trends" });
  }
};

/**
 * Get graph-ready weekly trends for sidebar visualization
 * Returns most recent value per week per assessment type
 * 
 * Rules:
 * 1. Fetch last 5 weeks of data
 * 2. For each week and assessment type:
 *    - Traverse 7-day array from latest (index 6) to earliest (index 0)
 *    - Return first non-null value found
 *    - Return null if entire week has no data
 * 3. Format as parallel arrays ready for Recharts consumption
 * 4. Return weeks in order: most recent first
 * 
 * Response format:
 * {
 *   ok: true,
 *   graphData: {
 *     weeks: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
 *     anxiety: [8, 7, 6, 5, null],
 *     depression: [10, 9, 7, 6, null],
 *     wellbeing: [12, 11, 10, 9, 8]
 *   }
 * }
 */
exports.getGraphTrends = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    // Fetch last 5 weeks only
    const weeks = 5;
    const weekStarts = getLastNWeekStarts(weeks);

    // Fetch weekly summaries
    const summaries = await WeeklyAssessmentSummary.find({
      userId,
      weekStartDate: { $in: weekStarts },
    })
      .sort({ weekStartDate: -1 })
      .lean();

    // Map summaries by weekStartDate
    const summariesMap = {};
    summaries.forEach((s) => {
      summariesMap[s.weekStartDate.getTime()] = s;
    });

    /**
     * Helper: Extract most recent (latest day) score from a week's array
     * Array indexes: 0=Monday, 1=Tuesday, ..., 6=Sunday
     * Traverse from end (Sunday) backwards to find first non-null
     */
    const getMostRecentScore = (scoresArray) => {
      if (!scoresArray || scoresArray.length === 0) return null;
      // Traverse from index 6 (Sunday) down to 0 (Monday)
      for (let i = scoresArray.length - 1; i >= 0; i--) {
        if (scoresArray[i] !== null) {
          return scoresArray[i];
        }
      }
      return null; // Entire week has no data
    };

    // Transform weeks into graph-ready format
    const weekLabels = [];
    const anxietyScores = [];
    const depressionScores = [];
    const wellbeingScores = [];

    weekStarts.forEach((weekStart, index) => {
      // Generate week label: "Week 1" for most recent, "Week 5" for oldest
      const weekLabel = `Week ${index + 1}`;
      weekLabels.push(weekLabel);

      // Get summary for this week (or use defaults if missing)
      const summary = summariesMap[weekStart.getTime()] || {
        gadScores: [null, null, null, null, null, null, null],
        phqScores: [null, null, null, null, null, null, null],
        ghqScores: [null, null, null, null, null, null, null],
      };

      // Extract most recent score for each assessment
      anxietyScores.push(getMostRecentScore(summary.gadScores));
      depressionScores.push(getMostRecentScore(summary.phqScores));
      wellbeingScores.push(getMostRecentScore(summary.ghqScores));
    });

    return res.json({
      ok: true,
      graphData: {
        weeks: weekLabels,
        anxiety: anxietyScores,        // GAD-7
        depression: depressionScores,  // PHQ-9
        wellbeing: wellbeingScores,    // GHQ-12
      },
    });
  } catch (err) {
    console.error("Get graph trends error:", err);
    return res.status(500).json({ ok: false, message: "Error fetching graph trends" });
  }
};

/**
 * Generate AI-powered mental wellbeing suggestions based on assessment results
 * 
 * Request body:
 * {
 *   assessmentType: string,     // GAD-7, PHQ-9, GHQ-12
 *   score: number,              // Total assessment score
 *   severity: string,           // Severity level
 *   trend: Array (optional)     // Previous scores for context
 * }
 */
exports.generateSuggestion = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    const { assessmentType, score, severity, trend } = req.body;

    // Validate required fields
    if (!assessmentType || score === undefined || !severity) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields: assessmentType, score, severity",
      });
    }

    // Import OpenRouter service
    const { callOpenRouter } = require("../services/openrouterService");

    // Build context object for OpenRouter
    const context = {
      assessmentType,
      score,
      severity,
      trend: trend || [],
    };

    // Call OpenRouter to generate suggestion
    const suggestion = await callOpenRouter(context);

    return res.json({
      ok: true,
      suggestion,
    });
  } catch (err) {
    console.error("Generate suggestion error:", err);
    
    // Return safe error message
    return res.status(500).json({
      ok: false,
      message: "Unable to generate suggestion at this time. Please try again later.",
    });
  }
};
=======
const Assessment = require('../models/Assessment');
const goalController = require('./goalController');

// Submit an assessment
exports.submitAssessment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { assessmentType, score, severity, answers } = req.body;

    if (!assessmentType || !['gad7', 'phq9', 'ghq12'].includes(assessmentType)) {
      return res.status(400).json({ message: 'Invalid assessment type' });
    }

    if (score === undefined || score === null || score < 0) {
      return res.status(400).json({ message: 'Invalid score' });
    }

    const assessment = new Assessment({
      userId,
      assessmentType,
      score,
      severity,
      answers: answers || [],
      submittedAt: new Date()
    });

    await assessment.save();

    // Update progress for related goals
    await goalController.updateProgressForGoalType(userId, assessmentType);

    return res.status(201).json({ assessment });
  } catch (err) {
    console.error('Submit assessment error:', err);
    return res.status(500).json({ message: 'Error submitting assessment' });
  }
};

// Get latest assessments for a user
exports.getLatestAssessments = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const assessments = await Assessment.aggregate([
      { $match: { userId: userId } },
      { $sort: { submittedAt: -1 } },
      {
        $group: {
          _id: '$assessmentType',
          latest: { $first: '$$ROOT' }
        }
      }
    ]);

    const result = {
      gad7: null,
      phq9: null,
      ghq12: null
    };

    assessments.forEach(item => {
      if (item._id === 'gad7') result.gad7 = item.latest.score;
      if (item._id === 'phq9') result.phq9 = item.latest.score;
      if (item._id === 'ghq12') result.ghq12 = item.latest.score;
    });

    return res.json({ assessments: result });
  } catch (err) {
    console.error('Get latest assessments error:', err);
    return res.status(500).json({ message: 'Error fetching assessments' });
  }
};

>>>>>>> a6430b6a840b6a178420de15e7c9200d94033fba

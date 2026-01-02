const Assessment = require("../models/Assessment");
const AssessmentResult = require("../models/AssessmentResult");
const AssessmentAttempt = require("../models/AssessmentAttempt");
const WeeklyAssessmentSummary = require("../models/WeeklyAssessmentSummary");
const User = require("../models/User");
const {
  getWeekStartDate,
  getDayOfWeek,
  hasAssessmentToday,
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

    // Try to find by _id first (if it's a valid ObjectId), then by shortName
    let assessment;
    if (assessmentId.match(/^[0-9a-fA-F]{24}$/)) {
      assessment = await Assessment.findById(assessmentId);
    } else {
      // Query by shortName if not a valid ObjectId
      assessment = await Assessment.findOne({ shortName: assessmentId });
    }
    
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

    // Fetch assessment - try by _id first, then by shortName
    let assessment;
    if (assessmentId.match(/^[0-9a-fA-F]{24}$/)) {
      assessment = await Assessment.findById(assessmentId);
    } else {
      assessment = await Assessment.findOne({ shortName: assessmentId });
    }
    
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
    // Stores complete assessment result with all answers and score
    // This is the source of truth for the full submission data
    const result = await AssessmentResult.create({
      userId,
      assessmentId: assessment._id,
      assessmentName: assessment.name,
      totalScore,
      answers: answerWeights,
      severityLabel,
    });

    // ============ SAVE DAILY ATTEMPT ============
    // Stores daily tracking: tracks one submission per day per assessment type
    const now = new Date();
    const weekStartDate = getWeekStartDate(now);
    const dayOfWeek = getDayOfWeek(now);

    const attempt = await AssessmentAttempt.create({
      userId,
      assessmentType: assessment.name,
      score: totalScore,  // ✓ Matches AssessmentResult.totalScore
      severity: severityLabel,  // ✓ Matches AssessmentResult.severityLabel
      takenAt: now,
      weekStartDate,
      dayOfWeek,
    });

    // ============ UPDATE WEEKLY SUMMARY ============
    // Stores one value per assessment type per week
    // Same submission score is used here (consistent with AssessmentResult)
    // Fetch latest week record for this user
    const latestWeekRecord = await WeeklyAssessmentSummary.findOne({ userId })
      .sort({ weekNumber: -1 })
      .lean();

    let weekNumber;
    let updateObj = { lastUpdatedAt: now };

    if (!latestWeekRecord) {
      // First assessment ever - create Week 1
      weekNumber = 1;
    } else {
      // Calculate week difference from last update
      const timeDiffMs = now - new Date(latestWeekRecord.lastUpdatedAt);
      const diffWeeks = Math.floor(timeDiffMs / (1000 * 60 * 60 * 24 * 7));

      if (diffWeeks === 0) {
        // Same week - use existing week number
        weekNumber = latestWeekRecord.weekNumber;
      } else {
        // New week(s) - increment week number by the difference
        weekNumber = latestWeekRecord.weekNumber + diffWeeks;
      }
    }

    // Determine which score field to update based on assessment type
    if (assessment.name === "GAD-7") {
      updateObj.gadScore = totalScore;
    } else if (assessment.name === "PHQ-9") {
      updateObj.phqScore = totalScore;
    } else if (assessment.name === "GHQ-12") {
      updateObj.ghqScore = totalScore;
    }

    // Upsert: create if not exists, update if exists
    // Same week = overwrite, new week = create new record
    await WeeklyAssessmentSummary.findOneAndUpdate(
      { userId, weekNumber },
      {
        $set: updateObj,
        $setOnInsert: {
          userId,
          weekNumber,
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
 * Returns: Array of weekly summaries sorted by week (most recent)
 * Each summary contains gadScore, phqScore, ghqScore (single values, not arrays)
 */
exports.getWeeklyTrends = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ ok: false, message: "Unauthorized" });
    }

    // Get number of weeks from query (default 5)
    const weeks = Math.min(parseInt(req.query.weeks || "5"), 52); // Cap at 1 year

    // Fetch the maximum week number for this user
    const maxWeekRecord = await WeeklyAssessmentSummary.findOne({ userId })
      .sort({ weekNumber: -1 })
      .lean();

    // If no assessments yet, return empty array
    if (!maxWeekRecord) {
      return res.json({
        ok: true,
        weeklyTrends: [],
      });
    }

    const maxWeekNumber = maxWeekRecord.weekNumber;
    const minWeekNumber = Math.max(1, maxWeekNumber - (weeks - 1)); // Last N weeks (inclusive)

    // Fetch all weeks in the range, sorted by week number
    const summaries = await WeeklyAssessmentSummary.find({
      userId,
      weekNumber: { $gte: minWeekNumber, $lte: maxWeekNumber },
    })
      .sort({ weekNumber: -1 })
      .lean();

    return res.json({
      ok: true,
      weeklyTrends: summaries,
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

    // Fetch the maximum week number for this user
    const maxWeekRecord = await WeeklyAssessmentSummary.findOne({ userId })
      .sort({ weekNumber: -1 })
      .lean();

    // If no assessments yet, return empty graph data
    if (!maxWeekRecord) {
      return res.json({
        ok: true,
        graphData: {
          weeks: [],
          anxiety: [],
          depression: [],
          wellbeing: [],
        },
      });
    }

    const maxWeekNumber = maxWeekRecord.weekNumber;
    const minWeekNumber = Math.max(1, maxWeekNumber - 4); // Last 5 weeks (inclusive)

    // Fetch all weeks in the range
    const summaries = await WeeklyAssessmentSummary.find({
      userId,
      weekNumber: { $gte: minWeekNumber, $lte: maxWeekNumber },
    })
      .sort({ weekNumber: 1 })
      .lean();

    // Map summaries by weekNumber for quick lookup
    const summariesMap = {};
    summaries.forEach((s) => {
      summariesMap[s.weekNumber] = s;
    });

    // Build data for each week in the range (including skipped weeks with nulls)
    const weekLabels = [];
    const anxietyScores = [];
    const depressionScores = [];
    const wellbeingScores = [];

    for (let weekNum = minWeekNumber; weekNum <= maxWeekNumber; weekNum++) {
      weekLabels.push(`Week ${weekNum}`);

      // Get summary for this week (or use nulls if week was skipped)
      const summary = summariesMap[weekNum];

      if (summary) {
        anxietyScores.push(summary.gadScore || null);
        depressionScores.push(summary.phqScore || null);
        wellbeingScores.push(summary.ghqScore || null);
      } else {
        // Skipped week - all nulls
        anxietyScores.push(null);
        depressionScores.push(null);
        wellbeingScores.push(null);
      }
    }

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

    // Fetch user to include age (prefer `age` field, fall back to DOB calculation)
    const user = await User.findById(userId).lean();
    let userAge = user?.age || null;
    if (!userAge && user?.dob) {
      const dob = new Date(user.dob);
      const diffMs = Date.now() - dob.getTime();
      userAge = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    }

    // Map assessmentType -> weekly field
    const scoreFieldMap = {
      "GAD-7": "gadScore",
      "PHQ-9": "phqScore",
      "GHQ-12": "ghqScore",
    };

    const scoreField = scoreFieldMap[assessmentType] || null;

    // Fetch recent weekly scores for this assessment type (last 5 weeks)
    let recentWeeklyScores = [];
    if (scoreField) {
      const maxWeekRecord = await WeeklyAssessmentSummary.findOne({ userId })
        .sort({ weekNumber: -1 })
        .lean();

      if (maxWeekRecord) {
        const maxWeekNumber = maxWeekRecord.weekNumber;
        const minWeekNumber = Math.max(1, maxWeekNumber - 4);
        const summaries = await WeeklyAssessmentSummary.find({
          userId,
          weekNumber: { $gte: minWeekNumber, $lte: maxWeekNumber },
        })
          .sort({ weekNumber: 1 })
          .lean();

        const mapByWeek = {};
        summaries.forEach((s) => (mapByWeek[s.weekNumber] = s));
        for (let w = minWeekNumber; w <= maxWeekNumber; w++) {
          const s = mapByWeek[w];
          recentWeeklyScores.push(s ? (s[scoreField] ?? null) : null);
        }
      }
    }

    // Fetch AssessmentResult entries for this assessment type
    const recentResults = await AssessmentResult.find({ userId, assessmentName: assessmentType })
      .sort({ createdAt: -1 })
      .lean();

    // Build context object for OpenRouter
    const context = {
      assessmentType,
      score,
      severity,
      age: userAge,
      trend: trend || recentWeeklyScores,
      recentWeeklyScores,
      recentResults: recentResults.map((r) => ({
        totalScore: r.totalScore,
        severityLabel: r.severityLabel,
        createdAt: r.createdAt,
      })),
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

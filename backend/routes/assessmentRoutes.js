const express = require("express");
const assessmentRouter = express.Router();
const {
  getAssessments,
  getAssessmentQuestions,
  submitAssessment,
  getUserAssessmentHistory,
  getLatestScores,
  getWeeklyTrends,
  getGraphTrends,
  generateSuggestion,
} = require("../controllers/assessmentController");
const verifyToken = require("../middleware/authMiddleware");

// Public endpoints (no auth required)
assessmentRouter.get("/", getAssessments);
assessmentRouter.get("/:assessmentId/questions", getAssessmentQuestions);

// Protected endpoints (requires auth)
assessmentRouter.post("/:assessmentId/submit", verifyToken, submitAssessment);
assessmentRouter.get("/user/history", verifyToken, getUserAssessmentHistory);
assessmentRouter.get("/user/latest-scores", verifyToken, getLatestScores);
assessmentRouter.get("/user/weekly-trends", verifyToken, getWeeklyTrends);
assessmentRouter.get("/user/graph-trends", verifyToken, getGraphTrends);
assessmentRouter.post("/user/generate-suggestion", verifyToken, generateSuggestion);

module.exports = assessmentRouter;

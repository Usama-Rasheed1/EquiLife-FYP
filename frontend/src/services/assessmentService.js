import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_BASE_URL;

const assessmentService = {
  /**
   * Get all available assessments (without questions)
   */
  async getAssessments() {
    try {
      const res = await axios.get(`${API_BASE}/api/assessments`);
      return res.data;
    } catch (err) {
      console.error('Error fetching assessments:', err);
      throw err;
    }
  },

  /**
   * Get single assessment with all questions and options
   */
  async getAssessmentQuestions(assessmentId) {
    try {
      const res = await axios.get(
        `${API_BASE}/api/assessments/${assessmentId}/questions`
      );
      return res.data;
    } catch (err) {
      console.error('Error fetching assessment questions:', err);
      throw err;
    }
  },

  async submitAssessment(assessmentId, answers) {
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.post(
        `${API_BASE}/api/assessments/${assessmentId}/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      console.error('Error submitting assessment:', err);
      throw err;
    }
  },

  /**
   * Get user's assessment history
   */
  async getUserHistory() {
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get(
        `${API_BASE}/api/assessments/user/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      console.error('Error fetching assessment history:', err);
      throw err;
    }
  },

  /**
   * Get latest scores for all assessment types
   */
  async getLatestScores() {
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get(
        `${API_BASE}/api/assessments/user/latest-scores`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      console.error('Error fetching latest scores:', err);
      throw err;
    }
  },

  /**
   * Get weekly assessment trends for last N weeks
   * @param {number} weeks - Number of weeks to fetch (default 5)
   * @returns {Array} Array of weekly summaries with gadScores, phqScores, ghqScores
   */
  async getWeeklyTrends(weeks = 5) {
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get(
        `${API_BASE}/api/assessments/user/weekly-trends?weeks=${weeks}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      console.error('Error fetching weekly trends:', err);
      throw err;
    }
  },

  /**
   * Get graph-ready weekly trends (sidebar visualization)
   * Returns most recent value per week for each assessment type
   * Already formatted for Recharts consumption
   * 
   * @returns {Object} { ok, graphData: { weeks, anxiety, depression, wellbeing } }
   */
  async getGraphTrends() {
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get(
        `${API_BASE}/api/assessments/user/graph-trends`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      console.error('Error fetching graph trends:', err);
      throw err;
    }
  },

  /**
   * Generate AI-powered mental wellbeing suggestion based on assessment results
   * @param {Object} context - Assessment context
   * @param {string} context.assessmentType - Type of assessment (GAD-7, PHQ-9, GHQ-12)
   * @param {number} context.score - Total score
   * @param {string} context.severity - Severity level
   * @param {Array} context.trend - Optional previous scores
   * @returns {Object} { ok, suggestion }
   */
  async generateSuggestion(context) {
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.post(
        `${API_BASE}/api/assessments/user/generate-suggestion`,
        context,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return res.data;
    } catch (err) {
      console.error('Error generating suggestion:', err);
      throw err;
    }
  },
};

export default assessmentService;

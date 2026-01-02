/**
 * Get the Monday of the week containing the given date.
 * Used for consistent weekly bucketing across all queries.
 * @param {Date} date - The reference date
 * @returns {Date} - Monday 00:00:00 of that week (in UTC)
 */
function getWeekStartDate(date) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(d.setUTCDate(diff));
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/**
 * Get day of week (1–7) where 1 = Monday, 7 = Sunday
 * @param {Date} date - The date
 * @returns {number} - Day of week (1–7)
 */
function getDayOfWeek(date) {
  const day = date.getUTCDay(); // 0–6
  return day === 0 ? 7 : day; // Convert Sunday (0) to 7
}

/**
 * Check if user has already taken an assessment of this type today.
 * "Today" is based on UTC date.
 * @param {string} userId - The user ID
 * @param {string} assessmentType - GAD-7, PHQ-9, or GHQ-12
 * @param {Model} AssessmentAttempt - The model class
 * @returns {Promise<boolean>} - True if already taken today
 */
async function hasAssessmentToday(userId, assessmentType, AssessmentAttempt) {
  const now = new Date();
  const startOfDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  );
  const endOfDay = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );

  const attempt = await AssessmentAttempt.findOne({
    userId,
    assessmentType,
    takenAt: { $gte: startOfDay, $lte: endOfDay },
  });

  return !!attempt;
}

/**
 * Get the last N weeks of dates (Monday start dates).
 * Useful for querying weekly summaries.
 * @param {number} weeks - Number of weeks to include
 * @returns {Date[]} - Array of Monday dates, most recent first
 */
function getLastNWeekStarts(weeks = 5) {
  const result = [];
  const now = new Date();
  const weekStart = getWeekStartDate(now);

  for (let i = 0; i < weeks; i++) {
    const date = new Date(weekStart);
    date.setUTCDate(date.getUTCDate() - i * 7);
    result.push(date);
  }

  return result;
}

/**
 * Calculate the global week number for a user based on their first assessment.
 * Week 1 starts when the user takes their first assessment.
 * 
 * Algorithm:
 * 1. Fetch user's most recent assessment (any type)
 * 2. Calculate week difference between that date and current date
 * 3. Add difference to the week number of that assessment
 * 
 * @param {string} userId - User ID
 * @param {Model} WeeklyAssessmentSummary - The model to query
 * @returns {Promise<number>} - Current week number for this user
 */
async function calculateCurrentWeekNumber(userId, WeeklyAssessmentSummary) {
  // Get the most recent assessment (highest week number)
  const lastRecord = await WeeklyAssessmentSummary.findOne({ userId })
    .sort({ weekNumber: -1 })
    .lean();

  if (!lastRecord) {
    // First time user is taking an assessment
    return 1;
  }

  // Calculate number of weeks since the week of the last record
  const lastWeekStart = new Date(lastRecord.weekStartDate);
  const currentWeekStart = getWeekStartDate(new Date());

  // Calculate difference in weeks
  const diffTime = currentWeekStart - lastWeekStart;
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

  if (diffWeeks === 0) {
    // Same week as the last assessment
    return lastRecord.weekNumber;
  } else {
    // New week(s) - increment by the difference
    return lastRecord.weekNumber + diffWeeks;
  }
}

/**
 * Get a user's week number on a specific date.
 * Used to determine which week a particular assessment belongs to.
 * 
 * @param {string} userId - User ID
 * @param {Date} assessmentDate - The date of the assessment
 * @param {Model} WeeklyAssessmentSummary - The model to query
 * @returns {Promise<number>} - Week number for that date
 */
async function getWeekNumberForDate(userId, assessmentDate, WeeklyAssessmentSummary) {
  const weekStart = getWeekStartDate(assessmentDate);

  // Check if a record exists for this user in this week
  const existingRecord = await WeeklyAssessmentSummary.findOne({
    userId,
    weekStartDate: weekStart,
  }).lean();

  if (existingRecord) {
    return existingRecord.weekNumber;
  }

  // If not, calculate what the week number should be
  // Get the most recent record and calculate from there
  const lastRecord = await WeeklyAssessmentSummary.findOne({ userId })
    .sort({ weekNumber: -1 })
    .lean();

  if (!lastRecord) {
    // First assessment ever
    return 1;
  }

  // Calculate weeks between last record and this assessment date
  const lastWeekStart = new Date(lastRecord.weekStartDate);
  const diffTime = weekStart - lastWeekStart;
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));

  return lastRecord.weekNumber + diffWeeks;
}

module.exports = {
  getWeekStartDate,
  getDayOfWeek,
  hasAssessmentToday,
  getLastNWeekStarts,
  calculateCurrentWeekNumber,
  getWeekNumberForDate,
};

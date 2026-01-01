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

module.exports = {
  getWeekStartDate,
  getDayOfWeek,
  hasAssessmentToday,
  getLastNWeekStarts,
};

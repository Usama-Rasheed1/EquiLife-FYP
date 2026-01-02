import { getExerciseLogsByWeek, getWeekStart } from './fitnessService';

const BASE = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:5001';

function authHeaders() {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

// Get activity summary data
export async function getActivitySummary() {
  try {
    const [assessments, fitness, nutrition] = await Promise.all([
      getAssessmentConsistency(),
      getWorkoutCompletion(),
      getMealLoggingAccuracy()
    ]);

    return {
      assessmentConsistency: assessments.percentage,
      workoutCompletion: fitness.workoutRate,
      caloriesBurned: fitness.weeklyCalories,
      mealLoggingAccuracy: nutrition.percentage
    };
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    return {
      assessmentConsistency: 0,
      workoutCompletion: 0,
      caloriesBurned: 0,
      mealLoggingAccuracy: 0
    };
  }
}

// Assessment Consistency
async function getAssessmentConsistency() {
  try {
    const res = await fetch(`${BASE}/api/assessments/user/history`, { headers: authHeaders() });
    if (!res.ok) return { percentage: 0 };
    
    const data = await res.json();
    const assessments = data.results || [];
    
    if (assessments.length === 0) return { percentage: 0 };
    
    // Get current week's assessments
    const now = new Date();
    const weekStart = new Date(now);
    const day = weekStart.getDay();
    const diffToMonday = ((day + 6) % 7);
    weekStart.setDate(weekStart.getDate() - diffToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    const currentWeekAssessments = assessments.filter(a => {
      const assessmentDate = new Date(a.createdAt);
      return assessmentDate >= weekStart;
    });
    
    // Count unique assessment types taken this week
    const assessmentTypes = new Set();
    currentWeekAssessments.forEach(a => {
      assessmentTypes.add(a.assessmentName);
    });
    
    // Calculate percentage: taken assessments / 3 total assessments * 100
    const percentage = Math.round((assessmentTypes.size / 3) * 100);
    return { percentage };
  } catch (error) {
    return { percentage: 0 };
  }
}

// Workout Completion Rate
async function getWorkoutCompletion() {
  try {
    // Get current week start date
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const weekStartStr = getWeekStart(today);
    
    console.log('Fetching fitness data for week:', weekStartStr);
    
    const data = await getExerciseLogsByWeek(weekStartStr, null);
    console.log('Fitness API response:', data);
    
    const activities = data.activities || {};
    
    // Count days with activities and total calories
    let activeDays = 0;
    let totalCalories = 0;
    
    Object.values(activities).forEach(dayActivities => {
      if (dayActivities && dayActivities.length > 0) {
        activeDays++;
        dayActivities.forEach(activity => {
          totalCalories += activity.caloriesBurned || 0;
        });
      }
    });
    
    console.log('Calculated:', { activeDays, totalCalories });
    
    const workoutRate = Math.round((activeDays / 7) * 100);
    return { workoutRate, weeklyCalories: totalCalories };
  } catch (error) {
    console.error('Workout completion error:', error);
    return { workoutRate: 0, weeklyCalories: 0 };
  }
}

// Meal Logging Accuracy
async function getMealLoggingAccuracy() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await fetch(`${BASE}/api/meals/daily?date=${today}`, { headers: authHeaders() });
    if (!res.ok) return { percentage: 0 };
    
    const data = await res.json();
    const meals = data.meals || {};
    
    // Count logged meals for today
    let loggedMeals = 0;
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
    
    mealTypes.forEach(mealType => {
      if (meals[mealType] && meals[mealType].length > 0) {
        loggedMeals++;
      }
    });
    
    // Calculate percentage based on 3 meals per day
    const percentage = Math.round((loggedMeals / 3) * 100);
    return { percentage: Math.min(percentage, 100) };
  } catch (error) {
    console.error('Meal logging error:', error);
    return { percentage: 0 };
  }
}
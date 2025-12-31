import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AppModal from "../components/AppModal";
import { Target, TrendingUp, TrendingDown, Minus, CheckCircle2, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { getGoals, getAvailableGoals, startGoal, restartGoal } from "../services/goalService";
// import { getLatestAssessments } from "../services/assessmentService";

// Map backend goal types to frontend goal IDs
const GOAL_TYPE_TO_ID = {
  'gad7': 'control-anxiety',
  'phq9': 'reduce-depression',
  'ghq12': 'improve-mental-health',
  'weight': 'get-slim',
  'protein': 'build-muscle',
  'calories_burned': 'improve-activity'
};

const GOAL_ID_TO_TYPE = {
  'control-anxiety': 'gad7',
  'reduce-depression': 'phq9',
  'improve-mental-health': 'ghq12',
  'get-slim': 'weight',
  'build-muscle': 'protein',
  'improve-activity': 'calories_burned'
};

// Goal definitions - System-generated based on available metrics
const AVAILABLE_GOALS = [
  // Mental Health Goals
  {
    id: "control-anxiety",
    goalType: "gad7",
    title: "Control Anxiety",
    description: "Reduce anxiety levels based on GAD-7 assessment scores",
    metric: "GAD-7",
    type: "mental",
    improvementDirection: "decrease",
  },
  {
    id: "reduce-depression",
    goalType: "phq9",
    title: "Reduce Depression",
    description: "Improve mood based on PHQ-9 assessment scores",
    metric: "PHQ-9",
    type: "mental",
    improvementDirection: "decrease",
  },
  {
    id: "improve-mental-health",
    goalType: "ghq12",
    title: "Improve General Mental Health",
    description: "Enhance overall wellbeing based on GHQ-12 scores",
    metric: "GHQ-12",
    type: "mental",
    improvementDirection: "decrease",
  },
  // Fitness & Nutrition Goals
  {
    id: "get-slim",
    goalType: "weight",
    title: "Weight Goal",
    description: "Achieve your weight target",
    metric: "Weight (kg)",
    type: "fitness",
    improvementDirection: "decrease",
  },
  {
    id: "build-muscle",
    goalType: "protein",
    title: "Build Muscle",
    description: "Gain muscle mass through increased protein intake",
    metric: "Protein Intake (g)",
    type: "fitness",
    improvementDirection: "increase",
  },
  {
    id: "improve-activity",
    goalType: "calories_burned",
    title: "Improve Daily Activity",
    description: "Increase weekly calories burned through regular exercise",
    metric: "Weekly Calories Burned",
    type: "fitness",
    improvementDirection: "increase",
  },
];

// Get recommendations based on goal type and status
const getRecommendations = (goal, status) => {
  const recommendations = {
    "control-anxiety": {
      improving: [
        "Continue practicing 5–10 minutes of daily breathing exercises",
        "Maintain your current sleep routine",
        "Keep a gratitude journal to track positive moments",
      ],
      regressing: [
        "Practice 5–10 minutes of daily breathing exercises",
        "Avoid caffeine in the evenings",
        "Maintain a consistent sleep routine (7-9 hours)",
        "Consider mindfulness meditation apps",
      ],
      stable: [
        "Practice 5–10 minutes of daily breathing exercises",
        "Avoid caffeine in the evenings",
        "Maintain a consistent sleep routine",
      ],
    },
    "reduce-depression": {
      improving: [
        "Continue regular physical activity",
        "Maintain social connections",
        "Practice self-compassion exercises",
      ],
      regressing: [
        "Engage in 30 minutes of physical activity daily",
        "Reach out to friends or family",
        "Practice gratitude journaling",
        "Consider professional support if needed",
      ],
      stable: [
        "Engage in regular physical activity",
        "Maintain social connections",
        "Practice gratitude journaling",
      ],
    },
    "improve-mental-health": {
      improving: [
        "Continue your current wellness practices",
        "Maintain work-life balance",
        "Keep engaging in activities you enjoy",
      ],
      regressing: [
        "Prioritize sleep (7-9 hours nightly)",
        "Reduce screen time before bed",
        "Engage in stress-reducing activities",
        "Practice time management",
      ],
      stable: [
        "Prioritize sleep (7-9 hours nightly)",
        "Reduce screen time before bed",
        "Engage in stress-reducing activities",
      ],
    },
    "get-slim": {
      improving: [
        "Maintain calorie deficit of ~300 kcal",
        "Continue increasing daily steps",
        "Avoid late-night snacks",
      ],
      regressing: [
        "Maintain calorie deficit of ~300 kcal daily",
        "Increase daily steps by 2000-3000",
        "Avoid late-night snacks",
        "Track all meals and beverages",
      ],
      stable: [
        "Maintain calorie deficit of ~300 kcal",
        "Increase daily steps",
        "Avoid late-night snacks",
      ],
    },
    "build-muscle": {
      improving: [
        "Continue progressive overload workouts",
        "Maintain protein intake ≥ recommended",
        "Ensure adequate rest and recovery",
      ],
      regressing: [
        "Ensure protein intake ≥ 1.6g per kg body weight",
        "Focus on progressive overload in workouts",
        "Get 7-9 hours of sleep for recovery",
        "Consider protein supplements if needed",
      ],
      stable: [
        "Ensure protein intake ≥ recommended",
        "Focus on progressive overload workouts",
        "Get adequate rest and recovery",
      ],
    },
    "improve-activity": {
      improving: [
        "Continue your current activity level",
        "Gradually increase workout intensity",
        "Track weekly progress",
      ],
      regressing: [
        "Aim for 150 minutes of moderate activity per week",
        "Start with 10-minute daily walks",
        "Gradually increase workout duration",
        "Find activities you enjoy",
      ],
      stable: [
        "Aim for 150 minutes of moderate activity per week",
        "Start with 10-minute daily walks",
        "Gradually increase workout duration",
      ],
    },
  };

  const goalRecs = recommendations[goal.id];
  if (!goalRecs) return [];
  
  const statusKey = status.status === "completed" ? "improving" : status.status;
  return goalRecs[statusKey] || goalRecs.stable || [];
};

const Goals = () => {
  const navigate = useNavigate();
  const [activeGoals, setActiveGoals] = useState([]);
  const [availableGoalsData, setAvailableGoalsData] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newlyAddedGoalId, setNewlyAddedGoalId] = useState(null);
  const [showEndGoalModal, setShowEndGoalModal] = useState(false);
  const [goalToEnd, setGoalToEnd] = useState(null);
  const [expandedAccordions, setExpandedAccordions] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentScores, setAssessmentScores] = useState({
    gad7: null,
    phq9: null,
    ghq12: null,
  });

  // Load goals and available goals from backend
  useEffect(() => {
    const loadGoals = async () => {
      try {
        setIsLoading(true);
        const [goals, availableGoals, assessments] = await Promise.all([
          getGoals(),
          getAvailableGoals(),
          getLatestAssessments().catch(() => ({ gad7: null, phq9: null, ghq12: null }))
        ]);

        // Filter active goals (not completed)
        const active = goals.filter(g => g.status !== 'completed');
        setActiveGoals(active);
        // availableGoals is already an array from the service
        setAvailableGoalsData(Array.isArray(availableGoals) ? availableGoals : []);
        setAssessmentScores(assessments);
      } catch (error) {
        console.error("Error loading goals:", error);
        showToast("Failed to load goals");
      } finally {
        setIsLoading(false);
      }
    };

    loadGoals();

    // Refresh every 30 seconds to update progress
    const interval = setInterval(loadGoals, 30000);
    return () => clearInterval(interval);
  }, []);

  // Show toast message
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Get goal status from backend data
  const getGoalStatus = (goal) => {
    if (goal.status === "completed") {
      return { status: "completed", color: "green", text: "Completed" };
    }
    if (goal.status === "almost_done") {
      return { status: "improving", color: "green", text: "Almost Done" };
    }
    if (goal.status === "in_progress") {
      return { status: "in_progress", color: "blue", text: "In Progress" };
    }
    return { status: "not_started", color: "gray", text: "Not Started" };
  };

  // Start a goal
  const handleStartGoal = async (goalIdOrType) => {
    try {
      // Find goal from available goals data (from backend)
      const goal = availableGoalsData.find((g) => g.id === goalIdOrType || g.goalType === goalIdOrType);
      if (!goal) {
        showToast("Goal not found");
        return;
      }

      // Check if already active
      if (activeGoals.some((g) => g.goalType === goal.goalType && g.status !== 'completed')) {
        showToast("This goal is already active");
        return;
      }

      const newGoal = await startGoal(goal.goalType, goal.improvementDirection);
      setActiveGoals([...activeGoals, newGoal]);
      setNewlyAddedGoalId(goal.id || goal.goalType);
      setShowSuccessModal(true);
      
      // Refresh available goals
      const available = await getAvailableGoals();
      setAvailableGoalsData(Array.isArray(available) ? available : []);
    } catch (error) {
      console.error("Error starting goal:", error);
      showToast(error.message || "Failed to start goal");
    }
  };

  // Handle modal navigation - just close modal and stay on goals page
  const handleViewProgress = () => {
    setShowSuccessModal(false);
    setNewlyAddedGoalId(null);
    // Scroll to top to show the newly added goal in active goals section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddAnotherGoal = () => {
    setShowSuccessModal(false);
    setNewlyAddedGoalId(null);
  };

  // End goal confirmation
  const handleEndGoalClick = (goalId) => {
    setGoalToEnd(goalId);
    setShowEndGoalModal(true);
  };

  // Handle end goal (for now, just remove from active list - backend doesn't have delete endpoint)
  const handleConfirmEndGoal = async () => {
    if (goalToEnd) {
      // For now, we'll just filter it out from the active list
      // In a full implementation, you'd call an API to end the goal
      setActiveGoals(activeGoals.filter((g) => (g._id || g.id) !== goalToEnd));
    }
    setShowEndGoalModal(false);
    setGoalToEnd(null);
  };

  // Get all available goals from backend data (show all, disable if can't start)
  const getAvailableGoalsList = () => {
    // Return all goals from backend, they will be shown with disabled buttons if can't start
    return availableGoalsData;
  };

  // Check if any required base values are missing
  const hasMissingBaseValues = () => {
    return availableGoalsData.some(goal => !goal.hasBaseValue);
  };

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Your Goals</h1>
              <p className="text-gray-600 mt-1">
                Data-driven goals based on your assessments and metrics
              </p>
            </div>
          </div>

          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Active Goals
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeGoals.map((goal) => {
                  const progress = goal.progress || 0;
                  const status = getGoalStatus(goal);
                  const current = goal.currentValue || 0;
                  const baseline = goal.baseValue || 0;
                  const goalId = GOAL_TYPE_TO_ID[goal.goalType] || goal.goalType;
                  const goalDef = AVAILABLE_GOALS.find(g => g.id === goalId) || goal;
                  const recommendations = getRecommendations(goalDef, status);
                  const isExpanded = expandedAccordions[goal._id || goal.id];

                  return (
                    <div
                      key={goal._id || goal.id}
                      className="bg-white rounded-xl shadow-sm p-5 border border-gray-100"
                    >
                      {/* Header Row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            {goal.title}
                          </h3>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            status.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : status.status === "improving"
                              ? "bg-green-100 text-green-700"
                              : status.status === "regressing"
                              ? "bg-red-100 text-red-700"
                              : status.status === "in_progress"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {status.text}
                        </span>
                      </div>

                      {/* Progress Section */}
                      <div className="flex justify-center mb-4">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                          <svg 
                            className="transform -rotate-90 w-20 h-20" 
                            viewBox="0 0 80 80"
                            style={{ width: '80px', height: '80px' }}
                          >
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke="#e5e7eb"
                              strokeWidth="6"
                              fill="none"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="32"
                              stroke={
                                status.status === "completed"
                                  ? "#10b981"
                                  : status.status === "improving"
                                  ? "#10b981"
                                  : status.status === "regressing"
                                  ? "#ef4444"
                                  : "#3b82f6"
                              }
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 32}`}
                              strokeDashoffset={`${
                                2 * Math.PI * 32 * (1 - progress / 100)
                              }`}
                              className="transition-all duration-300"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-lg font-bold text-gray-800">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-center text-xs text-gray-500 mb-4">
                        Based on {goal.metric}
                      </p>

                      {/* Value Comparison */}
                      <div className="text-center text-sm text-gray-700 mb-4 pb-4 border-b border-gray-100">
                        <p className="font-medium">
                          Baseline: <span className="text-gray-600">{baseline.toFixed(1)}</span> → Current:{" "}
                          <span className="text-gray-800 font-semibold">{current.toFixed(1)}</span> → Target:{" "}
                          <span className="text-blue-600 font-semibold">{goal.targetValue?.toFixed(1)}</span>
                        </p>
                      </div>

                      {/* Recommendations Accordion */}
                      {recommendations.length > 0 && (
                        <div className="mb-4">
                          <button
                            onClick={() => toggleAccordion(goal._id || goal.id)}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Lightbulb className="text-yellow-500" size={18} />
                              <span className="text-sm font-semibold text-gray-700">
                                Recommendations & Tips
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp size={18} className="text-gray-500" />
                            ) : (
                              <ChevronDown size={18} className="text-gray-500" />
                            )}
                          </button>
                          {isExpanded && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <ul className="space-y-2">
                                {recommendations.map((rec, idx) => (
                                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                    <span className="text-blue-500 mt-1">•</span>
                                    <span>{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions Row */}
                      <div className="flex items-center gap-2 mt-4">
                        {goal.status === 'completed' ? (
                          <button
                            onClick={async () => {
                              try {
                                await restartGoal(goal._id);
                                // Refresh goals
                                const goals = await getGoals();
                                setActiveGoals(goals.filter(g => g.status !== 'completed'));
                                const available = await getAvailableGoals();
                                setAvailableGoalsData(available);
                              } catch (error) {
                                showToast(error.message || "Failed to restart goal");
                              }
                            }}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                          >
                            Restart Goal
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEndGoalClick(goal._id || goal.id)}
                              className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              End Goal
                            </button>
                            <button
                              onClick={() => {
                                // Scroll to top to show goal details - goal is already visible on this page
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                            >
                              View Progress
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Goals */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Available Goals
            </h2>
            {isLoading ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <p className="text-gray-500">Loading goals...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAvailableGoalsList().map((goal) => {
                  const isDisabled = !goal.canStart;
                  const disabledReason = goal.hasActiveGoal 
                    ? "Already active" 
                    : !goal.hasBaseValue 
                    ? "Missing base value" 
                    : "";
                  
                  return (
                    <div
                      key={goal.id || goal.goalType}
                      className={`bg-white rounded-xl shadow-sm p-5 border border-gray-100 transition-shadow ${
                        isDisabled ? 'opacity-75' : 'hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Target className="text-blue-600" size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            {goal.title}
                          </h3>
                          <p className="text-sm text-gray-600">{goal.description}</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            goal.type === "mental"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {goal.metric}
                        </span>
                      </div>
                      {isDisabled && disabledReason && (
                        <p className="text-xs text-gray-500 mb-2">{disabledReason}</p>
                      )}
                      <button
                        onClick={() => handleStartGoal(goal.id || goal.goalType)}
                        disabled={isDisabled}
                        className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                          isDisabled
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-500 hover:bg-blue-600 text-white"
                        }`}
                      >
                        Start Goal
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Missing Data Note */}
          {hasMissingBaseValues() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Please add or update your weight, assessments, nutrition, or activity values to accurately start and track your goals.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      <AppModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setNewlyAddedGoalId(null);
        }}
        title="🎯 Goal Added Successfully"
        widthClass="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Your goal has been added. Track your progress and follow the recommendations to achieve it.
          </p>
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleAddAnotherGoal}
              className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Add Another Goal
            </button>
            <button
              onClick={handleViewProgress}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              View My Goal Progress
            </button>
          </div>
        </div>
      </AppModal>

      {/* End Goal Confirmation Modal */}
      <AppModal
        isOpen={showEndGoalModal}
        onClose={() => {
          setShowEndGoalModal(false);
          setGoalToEnd(null);
        }}
        title="End Goal"
        widthClass="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to end this goal? This will stop tracking but preserve your progress history.
          </p>
          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => {
                setShowEndGoalModal(false);
                setGoalToEnd(null);
              }}
              className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmEndGoal}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              End Goal
            </button>
          </div>
        </div>
      </AppModal>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideUp">
          <p className="font-medium">{toastMessage}</p>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </Layout>
  );
};

export default Goals;

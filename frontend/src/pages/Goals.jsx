import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AppModal from "../components/AppModal";
import { Target, TrendingUp, TrendingDown, Minus, CheckCircle2, ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

// Goal definitions - System-generated based on available metrics
const AVAILABLE_GOALS = [
  // Mental Health Goals
  {
    id: "control-anxiety",
    title: "Control Anxiety",
    description: "Reduce anxiety levels based on GAD-7 assessment scores",
    metric: "GAD-7",
    type: "mental",
    targetValue: 5, // Target: Mild or lower (0-4)
    improvementDirection: "decrease", // Lower is better
  },
  {
    id: "reduce-depression",
    title: "Reduce Depression",
    description: "Improve mood based on PHQ-9 assessment scores",
    metric: "PHQ-9",
    type: "mental",
    targetValue: 5, // Target: Mild or lower (0-4)
    improvementDirection: "decrease",
  },
  {
    id: "improve-mental-health",
    title: "Improve General Mental Health",
    description: "Enhance overall wellbeing based on GHQ-12 scores",
    metric: "GHQ-12",
    type: "mental",
    targetValue: 3, // Target: Low distress (0-3)
    improvementDirection: "decrease",
  },
  // Fitness & Nutrition Goals
  {
    id: "get-slim",
    title: "Get Slim",
    description: "Achieve healthy BMI through balanced calories and activity",
    metric: "BMI",
    type: "fitness",
    targetValue: 22, // Target BMI
    improvementDirection: "decrease", // For overweight users
    requiresMetrics: ["bmi", "caloriesIntake", "caloriesBurned", "bmr"],
  },
  {
    id: "build-muscle",
    title: "Build Muscle",
    description: "Gain muscle mass through calorie surplus and protein intake",
    metric: "Muscle Mass",
    type: "fitness",
    targetValue: null, // Percentage increase
    improvementDirection: "increase",
    requiresMetrics: ["caloriesIntake", "proteinIntake", "exerciseIntensity"],
  },
  {
    id: "improve-activity",
    title: "Improve Daily Activity",
    description: "Increase weekly calories burned through regular exercise",
    metric: "Weekly Calories Burned",
    type: "fitness",
    targetValue: 2000, // Target weekly calories
    improvementDirection: "increase",
    requiresMetrics: ["weeklyCaloriesBurned"],
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newlyAddedGoalId, setNewlyAddedGoalId] = useState(null);
  const [showEndGoalModal, setShowEndGoalModal] = useState(false);
  const [goalToEnd, setGoalToEnd] = useState(null);
  const [expandedAccordions, setExpandedAccordions] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [assessmentScores, setAssessmentScores] = useState({
    gad7: null,
    phq9: null,
    ghq12: null,
  });
  const [fitnessMetrics, setFitnessMetrics] = useState({
    bmi: null,
    caloriesIntake: null,
    caloriesBurned: null,
    weeklyCaloriesBurned: null,
    bmr: null,
    proteinIntake: null,
    exerciseIntensity: null,
  });

  // Load data from localStorage - reload when component mounts or becomes visible
  useEffect(() => {
    const loadData = () => {
      const savedGoals = localStorage.getItem("activeGoals");
      const savedAssessments = localStorage.getItem("assessmentScores");
      const savedFitness = localStorage.getItem("fitnessMetrics");

      if (savedGoals) {
        try {
          const parsed = JSON.parse(savedGoals);
          setActiveGoals(parsed);
        } catch (e) {
          console.error("Error parsing goals:", e);
        }
      }
      if (savedAssessments) {
        try {
          setAssessmentScores(JSON.parse(savedAssessments));
        } catch (e) {
          console.error("Error parsing assessments:", e);
        }
      }
      if (savedFitness) {
        try {
          setFitnessMetrics(JSON.parse(savedFitness));
        } catch (e) {
          console.error("Error parsing fitness:", e);
          // Initialize with default/estimated values if parsing fails
          setFitnessMetrics({
            bmi: 22.5,
            caloriesIntake: 2000,
            caloriesBurned: 500,
            weeklyCaloriesBurned: 3500,
            bmr: 1500,
            proteinIntake: 50,
            exerciseIntensity: 3,
          });
        }
      } else {
        // Initialize with default/estimated values if missing
        setFitnessMetrics({
          bmi: 22.5,
          caloriesIntake: 2000,
          caloriesBurned: 500,
          weeklyCaloriesBurned: 3500,
          bmr: 1500,
          proteinIntake: 50,
          exerciseIntensity: 3,
        });
      }
    };

    loadData();

    // Reload when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadData();
      }
    };

    // Also reload on window focus (when user navigates back via browser)
    const handleFocus = () => {
      loadData();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("activeGoals", JSON.stringify(activeGoals));
  }, [activeGoals]);

  // Show toast message
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Get current metric value for a goal
  const getCurrentMetricValue = (goal) => {
    switch (goal.metric) {
      case "GAD-7":
        return assessmentScores.gad7 ?? 10;
      case "PHQ-9":
        return assessmentScores.phq9 ?? 10;
      case "GHQ-12":
        return assessmentScores.ghq12 ?? 8;
      case "BMI":
        return fitnessMetrics.bmi ?? 22.5;
      case "Weekly Calories Burned":
        return fitnessMetrics.weeklyCaloriesBurned ?? 3500;
      case "Muscle Mass":
        return (
          (fitnessMetrics.exerciseIntensity ?? 3) * 10 +
          (fitnessMetrics.proteinIntake ?? 50) / 5
        );
      default:
        return 0;
    }
  };

  // Calculate goal progress
  const calculateProgress = (goal) => {
    const current = getCurrentMetricValue(goal);
    const baseline = goal.baselineValue ?? current;
    const target = goal.targetValue;

    if (!baseline || !target) return 0;

    if (goal.improvementDirection === "decrease") {
      const totalChange = baseline - target;
      const currentChange = baseline - current;
      if (totalChange <= 0) return 100;
      return Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
    } else {
      const totalChange = target - baseline;
      const currentChange = current - baseline;
      if (totalChange <= 0) return 100;
      return Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
    }
  };

  // Get goal status
  const getGoalStatus = (goal) => {
    const progress = calculateProgress(goal);
    const current = getCurrentMetricValue(goal);
    const baseline = goal.baselineValue ?? current;

    if (progress >= 100) {
      return { status: "completed", color: "green", text: "Completed" };
    }

    const change = current - baseline;
    if (goal.improvementDirection === "decrease") {
      if (change < -2) {
        return { status: "improving", color: "green", text: "Improving" };
      } else if (change > 2) {
        return { status: "regressing", color: "red", text: "Regressing" };
      }
    } else {
      if (change > 2) {
        return { status: "improving", color: "green", text: "Improving" };
      } else if (change < -2) {
        return { status: "regressing", color: "red", text: "Regressing" };
      }
    }

    return { status: "stable", color: "yellow", text: "Stable" };
  };

  // Start a goal
  const handleStartGoal = (goalId) => {
    // Check for duplicates
    if (activeGoals.some((g) => g.id === goalId)) {
      showToast("This goal is already active");
      return;
    }

    const goal = AVAILABLE_GOALS.find((g) => g.id === goalId);
    if (!goal) return;

    const currentValue = getCurrentMetricValue(goal);
    const newGoal = {
      ...goal,
      baselineValue: currentValue,
      startDate: new Date().toISOString(),
      status: "active",
    };

    setActiveGoals([...activeGoals, newGoal]);
    setNewlyAddedGoalId(goalId);
    setShowSuccessModal(true);
  };

  // Handle modal navigation
  const handleViewProgress = () => {
    setShowSuccessModal(false);
    navigate(`/dashboard/goals/${newlyAddedGoalId}`);
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

  const handleConfirmEndGoal = () => {
    if (goalToEnd) {
      // Archive goal instead of deleting
      const goal = activeGoals.find((g) => g.id === goalToEnd);
      if (goal) {
        const archivedGoals = JSON.parse(localStorage.getItem("archivedGoals") || "[]");
        archivedGoals.push({
          ...goal,
          endDate: new Date().toISOString(),
          status: "archived",
        });
        localStorage.setItem("archivedGoals", JSON.stringify(archivedGoals));
      }
      setActiveGoals(activeGoals.filter((g) => g.id !== goalToEnd));
    }
    setShowEndGoalModal(false);
    setGoalToEnd(null);
  };

  // Toggle accordion
  const toggleAccordion = (goalId) => {
    setExpandedAccordions((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }));
  };

  // Get available goals (not started)
  const getAvailableGoals = () => {
    const activeIds = activeGoals.map((g) => g.id);
    return AVAILABLE_GOALS.filter((g) => !activeIds.includes(g.id));
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
                  const progress = calculateProgress(goal);
                  const status = getGoalStatus(goal);
                  const current = getCurrentMetricValue(goal);
                  const baseline = goal.baselineValue ?? current;
                  const recommendations = getRecommendations(goal, status);
                  const isExpanded = expandedAccordions[goal.id];

                  return (
                    <div
                      key={goal.id}
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
                                  : "#f59e0b"
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
                          <span className="text-gray-800 font-semibold">{current.toFixed(1)}</span>
                        </p>
                      </div>

                      {/* Recommendations Accordion */}
                      {recommendations.length > 0 && (
                        <div className="mb-4">
                          <button
                            onClick={() => toggleAccordion(goal.id)}
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
                        <button
                          onClick={() => handleEndGoalClick(goal.id)}
                          className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          End Goal
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/goals/${goal.id}`)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                        >
                          View Progress
                        </button>
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
            {getAvailableGoals().length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <p className="text-gray-500">
                  All available goals have been started.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getAvailableGoals().map((goal) => (
                  <div
                    key={goal.id}
                    className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow"
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
                    <button
                      onClick={() => handleStartGoal(goal.id)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                    >
                      Start Goal
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Missing Data Note */}
          {(Object.values(assessmentScores).every((v) => v === null) ||
            Object.values(fitnessMetrics).some((v) => v === null)) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Some values are estimated due to missing
                data. Complete assessments and track fitness metrics for more
                accurate goal tracking.
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

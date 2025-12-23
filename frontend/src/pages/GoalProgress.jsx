import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { TrendingUp, TrendingDown, Minus, CheckCircle2, ArrowLeft } from "lucide-react";

const GoalProgress = () => {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const [goal, setGoal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

  // Load data from localStorage - reload when goalId changes or page becomes visible
  useEffect(() => {
    const loadData = () => {
      if (!goalId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const savedGoals = localStorage.getItem("activeGoals");
      const savedAssessments = localStorage.getItem("assessmentScores");
      const savedFitness = localStorage.getItem("fitnessMetrics");

      let foundGoal = null;

      if (savedGoals) {
        try {
          const goals = JSON.parse(savedGoals);
          foundGoal = goals.find((g) => g.id === goalId);
        } catch (e) {
          console.error("Error parsing goals:", e);
        }
      }

      // If not found in active goals, check archived
      if (!foundGoal) {
        const archivedGoals = localStorage.getItem("archivedGoals");
        if (archivedGoals) {
          try {
            const archived = JSON.parse(archivedGoals);
            foundGoal = archived.find((g) => g.id === goalId);
          } catch (e) {
            console.error("Error parsing archived goals:", e);
          }
        }
      }

      setGoal(foundGoal);
      setIsLoading(false);

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

    // Also reload on window focus
    const handleFocus = () => {
      loadData();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [goalId]);

  // Get current metric value for a goal
  const getCurrentMetricValue = (goal) => {
    if (!goal) return 0;
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
    if (!goal) return 0;
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
    if (!goal) return { status: "stable", color: "yellow", text: "Stable" };
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

  // Show loading state while checking for goal
  if (isLoading) {
    return (
      <Layout>
        <div className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => navigate("/dashboard/goals")}
              className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back to Goals
            </button>
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <p className="text-gray-500">Loading goal...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error if goalId is invalid or goal not found after loading
  if (!goalId || (!goal && !isLoading)) {
    return (
      <Layout>
        <div className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => navigate("/dashboard/goals")}
              className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              Back to Goals
            </button>
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <p className="text-gray-500 mb-4">Goal not found.</p>
              <p className="text-sm text-gray-400 mb-4">
                The goal with ID "{goalId}" could not be found. It may have been removed or the link is invalid.
              </p>
              <button
                onClick={() => navigate("/dashboard/goals")}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Return to Goals
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const progress = calculateProgress(goal);
  const status = getGoalStatus(goal);
  const current = getCurrentMetricValue(goal);
  const baseline = goal.baselineValue ?? current;

  return (
    <Layout>
      <div className="p-6 bg-gray-50 min-h-[calc(100vh-64px)]">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Button */}
          <button
            onClick={() => navigate("/dashboard/goals")}
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Back to Goals
          </button>

          {/* Goal Name */}
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{goal.title}</h1>
            <p className="text-gray-600">Metric: {goal.metric}</p>
          </div>

          {/* Progress Visualization */}
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            <div className="flex flex-col items-center">
              {/* Circular Progress */}
              <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                <svg 
                  className="transform -rotate-90 w-32 h-32" 
                  viewBox="0 0 128 128"
                  style={{ width: '128px', height: '128px' }}
                >
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={
                      status.status === "completed"
                        ? "#10b981"
                        : status.status === "improving"
                        ? "#10b981"
                        : status.status === "regressing"
                        ? "#ef4444"
                        : "#f59e0b"
                    }
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
                    className="transition-all duration-300"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-3xl font-bold text-gray-800">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-6">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
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

              {/* Value Comparison */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-4 text-lg">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Baseline</p>
                    <p className="text-2xl font-bold text-gray-800">{baseline.toFixed(1)}</p>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current</p>
                    <p className="text-2xl font-bold text-blue-600">{current.toFixed(1)}</p>
                  </div>
                  {goal.targetValue && (
                    <>
                      <div className="text-gray-400">→</div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Target</p>
                        <p className="text-2xl font-bold text-green-600">{goal.targetValue}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Trend Indicator */}
              <div className="mt-6">
                {status.status === "improving" && (
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp size={24} />
                    <span className="font-semibold">On Track</span>
                  </div>
                )}
                {status.status === "regressing" && (
                  <div className="flex items-center gap-2 text-red-600">
                    <TrendingDown size={24} />
                    <span className="font-semibold">Needs Attention</span>
                  </div>
                )}
                {status.status === "stable" && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <Minus size={24} />
                    <span className="font-semibold">Maintaining</span>
                  </div>
                )}
                {status.status === "completed" && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 size={24} />
                    <span className="font-semibold">Goal Achieved!</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Goal Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Started:</span>
                <span className="text-gray-800 font-medium">
                  {goal.startDate
                    ? new Date(goal.startDate).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    goal.type === "mental"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {goal.type === "mental" ? "Mental Health" : "Fitness"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Improvement Direction:</span>
                <span className="text-gray-800 font-medium">
                  {goal.improvementDirection === "decrease" ? "Decrease" : "Increase"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GoalProgress;


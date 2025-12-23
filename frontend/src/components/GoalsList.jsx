import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import getCircleDash from "../utils/circle";

const GoalItem = ({ icon, title, description, progress }) => {
  const radius = 16;
  const { strokeDasharray, strokeDashoffset } = getCircleDash(radius, progress);

  return (
    <div className="flex items-center space-x-4 py-2.5">
      <div className="w-11 h-11 bg-gray-100 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-800">{title}</h4>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <div className="relative w-14 h-14">
        <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r={16}
            stroke="#e6edf8"
            strokeWidth="4"
            fill="none"
          />
          <circle
            cx="22"
            cy="22"
            r={16}
            stroke="#3b82f6"
            strokeWidth="4"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

const GoalsList = () => {
  const navigate = useNavigate();
  const [activeGoals, setActiveGoals] = useState([]);
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

  // Load data from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem("activeGoals");
    const savedAssessments = localStorage.getItem("assessmentScores");
    const savedFitness = localStorage.getItem("fitnessMetrics");

    if (savedGoals) {
      setActiveGoals(JSON.parse(savedGoals));
    }
    if (savedAssessments) {
      setAssessmentScores(JSON.parse(savedAssessments));
    }
    if (savedFitness) {
      setFitnessMetrics(JSON.parse(savedFitness));
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
  }, []);

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

  const handleClick = () => {
    navigate("/dashboard/goals");
  };

  // Show up to 3 active goals
  const displayGoals = activeGoals.slice(0, 3);

  return (
    <div
      className="bg-white rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-800">Your Goals</h3>
        <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center">
          <ArrowUpRight size={12} className="text-blue-500" />
        </div>
      </div>

      {activeGoals.length === 0 ? (
        <div className="py-4 text-center">
          <p className="text-sm text-gray-500 mb-3">
            You have no active goals yet
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate("/dashboard/goals");
            }}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Set Your First Goal
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {displayGoals.map((goal, index) => {
            const progress = calculateProgress(goal);
            return (
              <GoalItem
                key={goal.id || index}
                icon={
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      goal.type === "mental"
                        ? "bg-purple-100"
                        : "bg-green-100"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full ${
                        goal.type === "mental"
                          ? "bg-purple-600"
                          : "bg-green-600"
                      }`}
                    ></div>
                  </div>
                }
                title={goal.title}
                description={goal.metric}
                progress={Math.round(progress)}
              />
            );
          })}
          {activeGoals.length > 3 && (
            <p className="text-xs text-gray-500 text-center pt-2">
              + {activeGoals.length - 3} more
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default GoalsList;

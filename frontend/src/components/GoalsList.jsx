import React from "react";
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
  const goals = [
    {
      icon: <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
        <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
      </div>,
      title: "Breathing Exercise",
      description: "3 times/day",
      progress: 95
    },
    {
      icon: <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
      </div>,
      title: "Strength Training",
      description: "2 workouts/day",
      progress: 70
    },
    {
      icon: <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
        <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
      </div>,
      title: "Meal Logging",
      description: "3 meals/day",
      progress: 45
    },
    {
      icon: <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
        <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
      </div>,
      title: "Detoxing Exercise",
      description: "Max 2 hrs screen time/day",
      progress: 80
    }
  ];

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-gray-800">Your Goals</h3>
        <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center">
          <ArrowUpRight size={12} className="text-blue-500" />
        </div>
      </div>

      <div className="space-y-2">
        {goals.map((goal, index) => (
          <GoalItem key={index} {...goal} />
        ))}
      </div>
    </div>
  );
};

export default GoalsList;

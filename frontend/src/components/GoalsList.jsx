import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Target } from "lucide-react";
import axios from "axios";

const GoalsList = () => {
  const navigate = useNavigate();
  const [activeGoals, setActiveGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveGoals = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_BASE_URL}/api/goals`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data?.goals) {
          // Filter only active goals (in_progress, almost_done, not_started) and take first 3
          const active = response.data.goals
            .filter(goal => ['in_progress', 'almost_done', 'not_started'].includes(goal.status))
            .slice(0, 5);
          setActiveGoals(active);
        }
      } catch (error) {
        console.error('Failed to fetch goals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveGoals();
  }, []);

  const handleClick = () => {
    navigate("/dashboard/goals");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-800">Your Goals</h3>
          <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center">
            <ArrowUpRight size={12} className="text-blue-500" />
          </div>
        </div>
        <div className="py-4 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

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
            className="bg-blue-500 hover:cursor-pointer hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Set Your Goals
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {activeGoals.map((goal, index) => (
            <div key={goal._id || index} className="flex items-center space-x-3 py-1">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Target size={12} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-800">{goal.title}</h4>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalsList;

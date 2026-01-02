import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import axios from "axios";

const GamificationTable = () => {
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_BASE_URL}/api/gamification/leaderboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data?.ok && response.data.leaderboard) {
          setLeaderboardData(response.data.leaderboard.slice(0, 3)); // Only show top 3 on dashboard
        } else {
          // No leaderboard data available
          setLeaderboardData([]);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        // No fallback data - show empty state
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const handleClick = () => {
    navigate("/dashboard/gamification");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800">Gamification Feature</h3>
          <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center">
            <ArrowUpRight size={12} className="text-blue-500" />
          </div>
        </div>
        <div className="text-center py-4 text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Gamification Feature</h3>
        <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center">
          <ArrowUpRight size={12} className="text-blue-500" />
        </div>
      </div>

      {leaderboardData.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">No leaderboard data yet.</p>
          <p className="text-xs mt-1">Complete challenges to see rankings!</p>
        </div>
      ) : (
        <div className="overflow-hidden border border-gray-100 rounded-md">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="w-16 text-left py-2 px-4 text-sm font-medium text-gray-600 first:rounded-tl-md">Rank</th>
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Name</th>
                <th className="w-20 text-right py-2 px-4 text-sm font-medium text-gray-600 last:rounded-tr-md">Points</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((item, index) => (
                <tr key={item.id || index} className="border-b last:border-b-0 border-gray-100">
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">
                    {String(item.rank || index + 1).padStart(2, '0')}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{item.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">{item.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GamificationTable;
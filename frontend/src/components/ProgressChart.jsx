import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { getActivitySummary } from "../services/activitySummaryService";

const ActivitySummary = () => {
  const [data, setData] = useState([
    { name: "Assessment Consistency", value: 0, color: "#10b981" },
    { name: "Workout Completion Rate", value: 0, color: "#3b82f6" },
    { name: "Calories Burned", value: 0, color: "#ef4444" },
    { name: "Meal Logging Accuracy", value: 0, color: "#6b7280" },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await getActivitySummary();
        setData([
          { name: "Assessment Consistency", value: summary.assessmentConsistency, color: "#10b981" },
          { name: "Workout Completion Rate", value: summary.workoutCompletion, color: "#3b82f6" },
          { name: "Calories Burned", value: summary.caloriesBurned, color: "#ef4444" },
          { name: "Meal Logging Accuracy", value: summary.mealLoggingAccuracy, color: "#6b7280" },
        ]);
      } catch (error) {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  // Hide all labels on the pie chart
  const renderCustomizedLabel = () => null;

  return (
    <div className="bg-white rounded-xl p-6.5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Activity Summary</h3>
      
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <>
          <div className="h-64 mb-4 flex items-center justify-center">
            <div className="rounded-full" style={{ width: 220, height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    label={renderCustomizedLabel}
                    labelLine={false}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Custom Legend with proportional bars */}
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-3 h-3 rounded-sm flex-shrink-0" 
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <div className="flex items-center space-x-3 min-w-[120px]">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        backgroundColor: item.color, 
                        width: item.name === 'Calories Burned' 
                          ? `${Math.min((item.value / 3500) * 100, 100)}%`
                          : `${item.value}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 min-w-[40px] text-right">
                    {item.name === 'Calories Burned' ? `${item.value}` : `${item.value}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ActivitySummary;

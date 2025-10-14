import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const ProgressChart = () => {
  const data = [
    { name: "Assessment Consistency", value: 17, color: "#10b981" },
    { name: "Workout Completion Rate", value: 23, color: "#3b82f6" },
    { name: "Calories Burned", value: 18, color: "#ef4444" },
    { name: "Meal Logging Accuracy", value: 7, color: "#6b7280" },
  ];

  // Hide all labels on the pie chart
  const renderCustomizedLabel = () => null;

  return (
    <div className="bg-white rounded-xl p-6.5 shadow-sm">
  <h3 className="text-lg font-semibold text-gray-800 mb-3">Progress</h3>
      
      <div className="h-64 mb-4 flex items-center justify-center">
        <div className="rounded-full">
          <ResponsiveContainer width={220} height={220}>
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
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-xs text-gray-700">{item.name}</span>
            </div>
            <div className="flex items-center space-x-2 min-w-[100px]">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ backgroundColor: item.color, width: `${item.value * 2.2}px`, minWidth: 10, maxWidth: 60 }}
              ></div>
              <span className="text-xs font-medium text-gray-900" style={{ minWidth: 32, textAlign: 'right' }}>{item.value}%</span>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressChart;

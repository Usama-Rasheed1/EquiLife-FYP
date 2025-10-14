import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChevronDown } from "lucide-react";

const data = [
  { month: "Jan", value: 65 },
  { month: "Feb", value: 45 },
  { month: "Mar", value: 80 },
  { month: "Apr", value: 70 },
  { month: "May", value: 90 },
  { month: "Jun", value: 55 },
  { month: "Jul", value: 75 },
  { month: "Aug", value: 85 },
  { month: "Sep", value: 60 },
];

const ActivitiesChart = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">Activities</h3>
        <ChevronDown size={20} className="text-gray-500" />
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            {/* subtle horizontal gridlines */}
            <CartesianGrid stroke="#eef2f7" strokeDasharray="3 8" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              padding={{ left: 12, right: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              domain={[0, 100]}
            />
            <Bar
              dataKey="value"
              fill="#3b82f6"
              barSize={12}
              radius={[12, 12, 12, 12]}
              isAnimationActive={true}
              animationDuration={900}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivitiesChart;

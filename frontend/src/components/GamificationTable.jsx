import React from "react";
import { ArrowUpRight } from "lucide-react";

const GamificationTable = () => {
  const data = [
    { rank: "01", name: "Muhammad Rehman", rewards: "289" },
    { rank: "02", name: "Muhammad Tayyab", rewards: "276" },
    { rank: "03", name: "Usama Rasheed", rewards: "249" },
  ];

  return (
  <div className="bg-white rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Gamification Feature</h3>
        <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center">
          <ArrowUpRight size={12} className="text-blue-500" />
        </div>
      </div>

      <div className="overflow-hidden border border-gray-100 rounded-md">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="w-16 text-left py-2 px-4 text-sm font-medium text-gray-600 first:rounded-tl-md">Rank</th>
              <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Name</th>
              <th className="w-20 text-right py-2 px-4 text-sm font-medium text-gray-600 last:rounded-tr-md">Rewards</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b last:border-b-0 border-gray-100">
                <td className="py-3 px-4 text-sm font-medium text-gray-800">{item.rank}</td>
                <td className="py-3 px-4 text-sm text-gray-600">{item.name}</td>
                <td className="py-3 px-4 text-sm text-gray-600 text-right">{item.rewards}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GamificationTable;

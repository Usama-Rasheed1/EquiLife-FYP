import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const SummaryCard = ({ title, value, percentage, customLabel, icon: Icon, bgColor = "#eef9ff" }) => {
  const isPositive = percentage >= 0;
  const isZero = percentage === 0;
  
  return (
    <div className={`rounded-xl p-4 shadow-sm border border-blue-200`} style={{ backgroundColor: bgColor }}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">{value}</h3>
          <p className="text-base font-semibold text-gray-700">{title}</p>
          <div className={`flex items-center text-xs font-medium mt-2 ${
            isZero ? 'text-gray-500' : isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {!isZero && (
              isPositive ? 
                <ArrowUpRight size={14} className="mr-1" /> : 
                <ArrowDownRight size={14} className="mr-1" />
            )}
            {customLabel ? customLabel : `${Math.abs(percentage)}% this week`}
          </div>
        </div>
        <div className="opacity-90 text-blue-500">
          {Icon && <Icon size={24} className="text-blue-500" />}
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;

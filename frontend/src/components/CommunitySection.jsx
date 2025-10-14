import React from "react";
import { User } from "lucide-react";

const CommunitySection = () => {
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm">
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User size={18} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-gray-800">Mind Matters</h4>
              <span className="text-xs text-blue-600">2 hours ago</span>
            </div>
            <p className="text-sm text-gray-600">Connect with others focused on improving their mental well-being.</p>
          </div>
        </div>
        
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <User size={18} className="text-gray-600" />
          </div>
          <div className="flex-1">
              <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-gray-800">Nutrition Corner</h4>
              <span className="text-xs text-blue-600">4 hours ago</span>
            </div>
            <p className="text-sm text-gray-600">Join others on a journey to better eating and balance nutrition.</p>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-center">
        <button className="inline-flex items-center justify-center bg-blue-600 text-white py-1.5 px-4 rounded-full text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors">
          Join Community
        </button>
      </div>
    </div>
  );
};

export default CommunitySection;

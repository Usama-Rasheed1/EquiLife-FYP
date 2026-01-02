import React from "react";
import { useNavigate } from "react-router-dom";

const ActionCard = ({ title, action, imageSrc, navigateTo, bgColor = "bg-white" }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (navigateTo) {
      navigate(navigateTo);
    }
  };

  return (
    <div className={`${bgColor} rounded-xl p-4 shadow-sm flex flex-col justify-between h-full`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
          {imageSrc ? (
            <img 
              src={imageSrc} 
              alt={title} 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.src = '/user.jpg'; }}
            />
          ) : (
            <div className="w-full h-full bg-gray-200"></div>
          )}
        </div>
      </div>
      <button 
        onClick={handleClick}
        className="text-blue-600 hover:cursor-pointer text-sm font-medium hover:text-blue-700 mt-4 text-left"
      >
        {action}
      </button>
    </div>
  );
};

export default ActionCard;

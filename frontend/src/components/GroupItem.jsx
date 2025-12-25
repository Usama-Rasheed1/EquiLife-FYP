import React from "react";

const GroupItem = ({ avatar, name, message, starred }) => {
  return (
    <div className="flex items-center justify-between p-2 text-gray-600 hover:bg-blue-100 hover:text-blue-600 cursor-pointer rounded-md">
      {/* Left: Avatar + Details */}
      <div className="flex items-start gap-2">
        <img
          src={avatar || '/user.jpg'}
          alt={`${name} avatar`}
          className="w-10 h-10 rounded-full object-cover"
          onError={(e) => { e.target.src = '/user.jpg'; }}
        />
        <div className="pl-2">
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-gray-500 truncate max-w-[160px]">
            {message}
          </p>
        </div>
      </div>

      {/* Right: Star Icon */}
      {starred ? (
        // Filled Star
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-yellow-500 cursor-pointer"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 
          9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ) : (
        // Outline Star
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-400 hover:text-yellow-500 cursor-pointer"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 
            5.111 5.518.442c.499.04.701.663.321.988l-4.192 
            3.57 1.285 5.385c.115.483-.408.874-.832.626L12 
            17.771l-4.745 2.85c-.424.248-.947-.143-.832-.626l1.285-5.385-4.192-3.57c-.38-.325-.178-.948.321-.988l5.518-.442 
            2.125-5.111z"
          />
        </svg>
      )}
    </div>
  );
};

export default GroupItem;
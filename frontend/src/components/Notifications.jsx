import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";

const dummyNotifications = [
  {
    id: 1,
    title: "New Message",
    description: "You received a new message in Fit Focus...",
    img: "https://via.placeholder.com/40",
  },
  {
    id: 2,
    title: "Workout Reminder",
    description: "Don't forget to log today's exercise...",
    img: "https://via.placeholder.com/40",
  },
  {
    id: 3,
    title: "Assessment Alert",
    description: "Your weekly mental health assessment is pending...",
    img: "https://via.placeholder.com/40",
  },
];

const Notifications = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(dummyNotifications);

  const dropdownRef = useRef();

  // Toggle dropdown
  const toggleDropdown = () => setIsOpen(!isOpen);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.length;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Icon */}
      <button
        onClick={toggleDropdown}
        className="relative p-1 rounded-full hover:bg-blue-500/20 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-200 font-semibold text-gray-800 flex items-center justify-between">
            <span>Your Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs text-gray-500 font-normal">
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Notification List */}
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications yet
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((note) => (
                <li
                  key={note.id}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <img
                    src={note.img}
                    alt={note.title}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {note.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {note.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Show More Button */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 text-center">
              <button className="text-blue-500 text-sm hover:underline font-medium">
                Show More
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;

import React, { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import axios from "axios";

const Notifications = ({ className = "", onOpenSettings, navigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const dropdownRef = useRef();

  const load = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;
      const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/notifications`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      // ignore network errors, fallback to empty list
    }
  };

  useEffect(() => { load(); }, []);

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

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) load();
  };

  // cap/unopened display requirement: show numeric up to 3
  const badgeText = unreadCount <= 3 ? String(unreadCount) : (unreadCount > 0 ? '3+' : '');

  const handleClickNotification = async (note) => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await axios.post(`${import.meta.env.VITE_BACKEND_BASE_URL}/api/notifications/${note._id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (err) {
      // ignore
    }

    // perform action
    if (note.action) {
      if (note.action.name === 'open_settings' && typeof onOpenSettings === 'function') {
        onOpenSettings();
      } else if (note.action.name === 'open_fitness' && typeof navigate === 'function') {
        navigate(note.action.target || '/fitness');
      } else if (note.action.name === 'open_assessment' && typeof navigate === 'function') {
        navigate(note.action.target || '/assessment');
      }
    }

    // optimistic update UI
    setNotifications((prev) => prev.map(n => n._id === note._id ? { ...n, isRead: true } : n));
    setUnreadCount(c => Math.max(0, c - (note.isRead ? 0 : 1)));
  };

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
            {badgeText}
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
                  key={note._id}
                  onClick={() => handleClickNotification(note)}
                  className={`flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${note.isRead ? 'opacity-60' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold flex-shrink-0">
                    {note.title ? note.title.charAt(0) : 'N'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {note.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {note.message}
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

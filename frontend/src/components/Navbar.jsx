import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Notifications from "./Notifications";
import ProfileSettingsModal from "./ProfileSettingsModal";
import { useSelector, useDispatch } from 'react-redux';
import { setUserData, clearUserData } from '../store/userSlice';

const Navbar = ({ userName, activePage = "dashboard", onToggleSidebar, userRole: propUserRole }) => {
  const dispatch = useDispatch();
  const storeUser = useSelector((s) => s.user || {});
  const [name, setName] = useState(userName || storeUser.fullName || '');
  const profilePhoto = storeUser.profilePhoto || "/user.jpg";

  const getPageTitle = () => {
    switch (activePage) {
      case "community":
        return "Community Interaction";
      case "assessment":
        return "Assessment";
      case "fitness":
        return "Fitness";
      case "nutrition":
        return "Nutrition";
      default:
        return `Welcome Back, ${name}`;
    }
  };

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const dropdownRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // fetch current user profile on mount if not in store
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        // if we already have profile data in store, set name from store
        if (storeUser && storeUser.fullName) {
          setName(storeUser.fullName);
          return;
        }
        const url = `${import.meta.env.VITE_BACKEND_BASE_URL}/api/auth/profile`;
        const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
        const u = res.data?.user;
        if (u) {
          if (u.fullName) setName(u.fullName);
          const p = u.profilePhoto
            ? u.profilePhoto.startsWith('data:') ? u.profilePhoto : u.profilePhoto
            : (u.gender && u.gender.toLowerCase() === 'female' ? '/user2.png' : '/user.jpg');
          dispatch(setUserData({ fullName: u.fullName, profilePhoto: p, weight: u.weightKg || undefined, dob: u.dob || undefined, age: u.age || undefined, role: u.role || undefined }));
        }
      } catch (err) {
        // ignore
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <nav className="bg-blue-400 py-3 lg:py-5 px-4 lg:px-6 shadow-md flex items-center justify-between w-full">
        
        {/* Left - Hamburger Menu + Page Title */}
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Hamburger Menu - Only visible on mobile */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1 text-white hover:bg-blue-500 rounded-md transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <span className="text-white text-lg lg:text-2xl font-semibold truncate">
            {getPageTitle()}
          </span>
        </div>

        {/* Right - Notifications and User */}
        <div
          className="flex items-center space-x-2 lg:space-x-4 relative flex-shrink-0"
          ref={dropdownRef}
        >
            {/* Notification Component: show only for simple users */}
            {((propUserRole && propUserRole === 'user') || (storeUser && storeUser.role === 'user')) && (
              <Notifications onOpenSettings={() => setSettingsOpen(true)} navigate={(t) => { if (t) window.location.href = t; }} />
            )}

          {/* User Avatar & Name */}
          <div
            className="flex items-center space-x-1 cursor-pointer mr-2 lg:mr-6"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <img
              src={profilePhoto}
              alt="User Avatar"
              className="h-6 w-6 lg:h-7 lg:w-7 rounded-full object-cover border border-white"
              onError={(e) => { e.target.src = "/user.jpg"; }}
            />
            <span className="text-white text-sm lg:text-md ml-1 lg:ml-2 hidden sm:block">
              {name}
            </span>
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-10 bg-white shadow-md rounded-md w-40 z-50">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  setSettingsOpen(true);
                  setDropdownOpen(false);
                }}
              >
                Settings
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={() => {
                  try { 
                    localStorage.removeItem('authToken');
                    dispatch(clearUserData());
                  } catch (e) {}
                  // redirect to landing page
                  window.location.href = '/';
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={(data) => {
          try {
            if (data?.fullName) setName(data.fullName);
            // update redux store with latest values only after successful save
            dispatch(setUserData({ fullName: data.fullName, profilePhoto: data.profilePhoto, dob: data.dob, weight: data.weightKg || data.weight, heightCm: data.heightCm || data.height }));
          } catch (e) {
            // ignore
          }
        }}
      />
    </>
  );
};

export default Navbar;

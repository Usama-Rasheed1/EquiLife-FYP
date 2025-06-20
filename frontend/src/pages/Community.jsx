import React, { useState, useRef, useEffect } from "react";

const Community = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-white shadow-md flex flex-col">
        <div className="flex items-center bg-blue-400 justify-center space-x-2 py-5 border-white border-b">
          <img src="/logoWhite.png" alt="Logo" className="h-8 w-8" />
          <span className="text-white font-bold text-xl mr-16">EquiLife</span>
        </div>

        <nav className="flex flex-col px-6 pt-4 text-gray-600 space-y-2 text-sm">
          {/* Dashboard */}
          <button className="flex items-center py-5 space-x-3 hover:text-blue-500">
            <img src="/dashIcon.png" alt="Dashboard Icon" className="h-5 w-5" />
            <span>Dashboard</span>
          </button>

          {/* Assessment */}
          <button className="flex items-center py-5 space-x-3 hover:text-blue-500">
            <img
              src="/mentalIcon.png"
              alt="Assessment Icon"
              className="h-5 w-5"
            />
            <span>Assessment</span>
          </button>

          {/* Fitness */}
          <button className="flex items-center py-5 space-x-3 hover:text-blue-500">
            <img
              src="/physicalIcon.png"
              alt="Fitness Icon"
              className="h-5 w-5"
            />
            <span>Fitness</span>
          </button>

          {/* Nutrition */}
          <button className="flex items-center py-5 space-x-3 hover:text-blue-500">
            <img
              src="/nutritionIcon.png"
              alt="Nutrition Icon"
              className="h-5 w-5"
            />
            <span>Nutrition</span>
          </button>

          {/* Community (active) */}
          <button className="flex items-center py-5 space-x-3 text-blue-600 font-semibold bg-gray-100 rounded-r-full pr-2">
            <img src="/commIcon.png" alt="Community Icon" className="h-5 w-5" />
            <span>Community</span>
          </button>
        </nav>
      </aside>

      {/* Right Side: Main Section */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <nav className="bg-blue-400 py-5 px-6 shadow-md flex items-center justify-between w-full">
          {/* Left - Logo, App Name, and Welcome Message */}
          <div className="flex items-center space-x-4">
            <span className="text-white text-2xl font-semibold">
              Welcome Back, Usama Rasheed
            </span>
          </div>

          {/* Right - Notifications and User */}
          <div
            className="flex items-center space-x-4 relative"
            ref={dropdownRef}
          >
            {/* Notification Icon */}
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white cursor-pointer"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0M3.124 7.5A8.969 8.969 0 0 1 5.292 3m13.416 0a8.969 8.969 0 0 1 2.168 4.5"
                />
              </svg>
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-1 rounded-full">
                11
              </span>
            </div>

            {/* User Avatar & Name */}
            <div
              className="flex items-center space-x-1 cursor-pointer mr-6"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <img
                src="/user.jpg"
                alt="User Avatar"
                className="h-7 w-7 rounded-full object-cover"
              />
              <span className="text-white text-md ml-2">Usama Rasheed</span>
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-10 bg-white shadow-md rounded-md w-40 z-50">
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                  Settings
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100">
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 bg-gray-50 p-4">
          <p className="text-gray-600">Community...</p>
        </main>
      </div>
    </div>
  );
};

export default Community;
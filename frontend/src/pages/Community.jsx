import React, { useState, useRef, useEffect } from "react";
import GroupItem from "../components/GroupItem";
import ChatWindow from "../components/ChatWindow";

const Community = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const [selectedGroup, setSelectedGroup] = useState(null);

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
              Community Interaction
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
        <main className="flex-1 flex">
          {/* Left side section with Group names */}

          <div className="w-1/4 pt-2">
            {/* Heading and Search */}
            <div className="heading-section flex items-center justify-between bg-white mb-2 p-3">
              <h2 className="flex text-lg font-semibold text-blue-600">
                Groups
              </h2>
              {/* Search button */}
              <svg
                className="cursor-pointer"
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="30"
                height="30"
                viewBox="0 0 50 50"
              >
                <path d="M 21.5 8 C 14.057 8 8 14.057 8 21.5 C 8 28.943 14.057 35 21.5 35 C 24.789065 35 27.805703 33.816017 30.150391 31.853516 C 30.435292 32.138417 39.711913 41.416007 39.943359 41.648438 C 40.413359 42.118437 41.176484 42.118437 41.646484 41.648438 C 42.116484 41.178438 42.116484 40.415312 41.646484 39.945312 C 41.415038 39.712882 32.138417 30.435292 31.853516 30.150391 C 33.816017 27.805703 35 24.789065 35 21.5 C 35 14.057 28.943 8 21.5 8 z M 21.5 9 C 28.392 9 34 14.608 34 21.5 C 34 28.392 28.392 34 21.5 34 C 14.608 34 9 28.392 9 21.5 C 9 14.608 14.608 9 21.5 9 z"></path>
              </svg>
            </div>

            {/* List of Groups */}

            <div
              onClick={() =>
                setSelectedGroup({
                  avatar: "https://avatar.iran.liara.run/public/25",
                  name: "The Lounge",
                  message: "Last message from this group...",
                })
              }
            >
              <GroupItem
                avatar="https://avatar.iran.liara.run/public/25"
                name="The Lounge"
                message="Last message from this group..."
                starred={true}
              />
            </div>

            <div
              onClick={() =>
                setSelectedGroup({
                  avatar:
                    "https://avatar.iran.liara.run/public/job/astronomer/male",
                  name: "Mind Matters",
                  message: "Last message...",
                })
              }
            >
              <GroupItem
                avatar="https://avatar.iran.liara.run/public/job/astronomer/male"
                name="Mind Matters"
                message="Last message..."
                starred={false}
              />
            </div>

            <div
              onClick={() =>
                setSelectedGroup({
                  avatar: "https://avatar.iran.liara.run/public/98",
                  name: "Fit Focus",
                  message: "Last message...",
                })
              }
            >
              <GroupItem
                avatar="https://avatar.iran.liara.run/public/98"
                name="Fit Focus"
                message="Last message..."
                starred={true}
              />
            </div>

            <div
              onClick={() =>
                setSelectedGroup({
                  avatar: "https://avatar.iran.liara.run/public/89",
                  name: "Nutrition Corner",
                  message: "Last message...",
                })
              }
            >
              <GroupItem
                avatar="https://avatar.iran.liara.run/public/89"
                name="Nutrition Corner"
                message="Last message..."
                starred={false}
              />
            </div>
          </div>

          {/* Right side section with Group names */}
          <div className="flex-1 p-4">
            <ChatWindow group={selectedGroup} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Community;

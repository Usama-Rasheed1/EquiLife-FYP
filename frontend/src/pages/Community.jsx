import React, { useState } from "react";
import GroupItem from "../components/GroupItem";
import ChatWindow from "../components/ChatWindow";
import Layout from "../components/Layout";

const Community = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showMobileGroups, setShowMobileGroups] = useState(false);

  const groups = [
    {
      id: 1,
      avatar: "https://avatar.iran.liara.run/public/25",
      name: "The Lounge",
      message: "Last message from this group...",
      time: "2h",
      starred: true
    },
    {
      id: 2,
      avatar: "https://avatar.iran.liara.run/public/job/astronomer/male",
      name: "Mind Matters",
      message: "Last message...",
      time: "4h",
      starred: false
    },
    {
      id: 3,
      avatar: "https://avatar.iran.liara.run/public/98",
      name: "Fit Focus",
      message: "Last message...",
      time: "1d",
      starred: true
    },
    {
      id: 4,
      avatar: "https://avatar.iran.liara.run/public/89",
      name: "Nutrition Corner",
      message: "Last message...",
      time: "2d",
      starred: false
    },
    {
      id: 5,
      avatar: "https://avatar.iran.liara.run/public/15",
      name: "Wellness Warriors",
      message: "Great workout session today!",
      time: "3d",
      starred: true
    },
    {
      id: 6,
      avatar: "https://avatar.iran.liara.run/public/42",
      name: "Mental Health Support",
      message: "Thanks for sharing your experience",
      time: "4d",
      starred: false
    },
    {
      id: 7,
      avatar: "https://avatar.iran.liara.run/public/67",
      name: "Healthy Recipes",
      message: "Check out this new smoothie recipe",
      time: "5d",
      starred: true
    },
    {
      id: 8,
      avatar: "https://avatar.iran.liara.run/public/33",
      name: "Meditation Group",
      message: "Daily meditation reminder",
      time: "1w",
      starred: false
    },
    {
      id: 9,
      avatar: "https://avatar.iran.liara.run/public/78",
      name: "Fitness Challenges",
      message: "30-day challenge starts tomorrow!",
      time: "1w",
      starred: true
    },
    {
      id: 10,
      avatar: "https://avatar.iran.liara.run/public/91",
      name: "Stress Management",
      message: "Breathing exercises for anxiety",
      time: "2w",
      starred: false
    }
  ];

  return (
    <Layout>
      <div className="flex h-full bg-white min-h-0 relative">
        {/* Mobile Groups Toggle Button */}
        <button
          onClick={() => setShowMobileGroups(!showMobileGroups)}
          className="lg:hidden fixed top-20 left-4 z-30 cursor-pointer text-white p-2 rounded-lg shadow-lg hover:shadow-xl transition-colors"
        >
          <img src="/group_icon.png" alt="Groups" className="w-5 h-5" />
        </button>

        {/* Mobile Groups Overlay */}
        {showMobileGroups && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setShowMobileGroups(false)}
          />
        )}

        {/* Mobile Groups Panel */}
        <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white transform transition-transform duration-300 ease-in-out ${
          showMobileGroups ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Mobile Groups Header */}
            <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-blue-400">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Groups</h2>
                <button
                  onClick={() => setShowMobileGroups(false)}
                  className="text-white hover:bg-blue-500 rounded-md p-1 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Search bar */}
              <div className="relative mt-4">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search groups..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Mobile Groups List */}
            <div className="flex-1 overflow-y-auto max-h-full pb-4">
              {groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => {
                    setSelectedGroup(group);
                    setShowMobileGroups(false);
                  }}
                  className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                    selectedGroup?.id === group.id ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={group.avatar}
                      alt={`${group.name} avatar`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium text-sm ${selectedGroup?.id === group.id ? 'font-bold' : ''}`}>
                        {group.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {group.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{group.time}</span>
                    {group.starred ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-yellow-500"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111 5.518.442c.499.04.701.663.321.988l-4.192 3.57 1.285 5.385c.115.483-.408.874-.832.626L12 17.771l-4.745 2.85c-.424.248-.947-.143-.832-.626l1.285-5.385-4.192-3.57c-.38-.325-.178-.948.321-.988l5.518-.442 2.125-5.111z"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Left side section with Group names - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block lg:w-1/4 bg-white border-r border-gray-200 flex flex-col min-h-0">
          {/* Heading and Search */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Groups
              </h2>
        </div>
            {/* Search bar */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search groups..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* List of Groups - Scrollable */}
          <div className="flex-1 overflow-y-auto max-h-full " style={{paddingBottom: '110px'}}>
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  selectedGroup?.id === group.id ? 'bg-gray-100' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={group.avatar}
                    alt={`${group.name} avatar`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium text-sm ${selectedGroup?.id === group.id ? 'font-bold' : ''}`}>
                      {group.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {group.message}
                    </p>
            </div>
            </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{group.time}</span>
                  {group.starred ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-yellow-500"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111 5.518.442c.499.04.701.663.321.988l-4.192 3.57 1.285 5.385c.115.483-.408.874-.832.626L12 17.771l-4.745 2.85c-.424.248-.947-.143-.832-.626l1.285-5.385-4.192-3.57c-.38-.325-.178-.948.321-.988l5.518-.442 2.125-5.111z"
                      />
                    </svg>
                  )}
            </div>
              </div>
            ))}
            </div>
          </div>

        {/* Right side section with Chat Window */}
        <div className="flex-1 flex flex-col w-full lg:w-auto min-h-0">
          <ChatWindow group={selectedGroup} />
        </div>
      </div>
    </Layout>
  );
};

export default Community;

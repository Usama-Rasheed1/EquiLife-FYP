import React, { useState, useEffect } from "react";
import GroupItem from "../components/GroupItem";
import ChatWindow from "../components/ChatWindow";
import Layout from "../components/Layout";
import useSocket from "../hooks/useSocket";

const Community = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showMobileGroups, setShowMobileGroups] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { joinGroup, leaveGroup, isConnected, connectionError, messages, typingUsers, sendMessage, startTyping, stopTyping } = useSocket();

  // static predefined groups (not stored in DB)
  const groups = [
    { id: 'The Lounge', avatar: '/user.jpg', name: 'The Lounge', message: 'Last message from this group...', time: '2h', starred: true },
    { id: 'Mind Matters', avatar: '/user.jpg', name: 'Mind Matters', message: 'Last message...', time: '4h', starred: false },
    { id: 'Fit Focus', avatar: '/user.jpg', name: 'Fit Focus', message: 'Last message...', time: '1d', starred: true },
    { id: 'Nutrition Corner', avatar: '/user.jpg', name: 'Nutrition Corner', message: 'Last message...', time: '2d', starred: false },
    { id: 'Wellness Warriors', avatar: '/user.jpg', name: 'Wellness Warriors', message: 'Great workout session today!', time: '3d', starred: true },
    { id: 'Mental Health Support', avatar: '/user.jpg', name: 'Mental Health Support', message: 'Thanks for sharing your experience', time: '4d', starred: false },
    { id: 'Healthy Recipes', avatar: '/user.jpg', name: 'Healthy Recipes', message: 'Check out this new smoothie recipe', time: '5d', starred: true },
    { id: 'Meditation Group', avatar: '/user.jpg', name: 'Meditation Group', message: 'Daily meditation reminder', time: '1w', starred: false },
    { id: 'Fitness Challenges', avatar: '/user.jpg', name: 'Fitness Challenges', message: '30-day challenge starts tomorrow!', time: '1w', starred: true },
    { id: 'Stress Management', avatar: '/user.jpg', name: 'Stress Management', message: 'Breathing exercises for anxiety', time: '2w', starred: false }
  ];

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGroupSelect = async (group) => {
    if (selectedGroup) leaveGroup();
    setSelectedGroup(group);
    if (group && isConnected) await joinGroup(group.id);
    setShowMobileGroups(false);
  };

  useEffect(() => {
    if (selectedGroup && isConnected) {
      // fire-and-forget; joinGroup handles its own async flow
      joinGroup(selectedGroup.id).catch((e) => console.error('Failed to join group from effect', e));
    }
  }, [isConnected, selectedGroup?.id]);

  useEffect(() => {
    return () => { if (selectedGroup) leaveGroup(); };
  }, []);

  const renderGroupItem = (group) => (
    <div
      key={group.id}
      onClick={() => handleGroupSelect(group)}
      className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${selectedGroup?.id === group.id ? 'bg-gray-100' : ''}`}
    >
      <div className="flex items-center gap-3">
        <img
          src={group.avatar}
          alt={`${group.name} avatar`}
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => { e.target.src = '/user.jpg'; }}
        />
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-sm ${selectedGroup?.id === group.id ? 'font-bold' : ''}`}>
            {group.name}
          </h3>
          <p className="text-xs text-gray-500 truncate">{group.message}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">{group.time}</span>
        {group.starred ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111 5.518.442c.499.04.701.663.321.988l-4.192 3.57 1.285 5.385c.115.483-.408.874-.832.626L12 17.771l-4.745 2.85c-.424.248-.947-.143-.832-.626l1.285-5.385-4.192-3.57c-.38-.325-.178-.948.321-.988l5.518-.442 2.125-5.111z" />
          </svg>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      <div className="flex h-full bg-white min-h-0 relative">
        {connectionError && (
          <div className="fixed top-20 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
            Connection Error: {connectionError}
          </div>
        )}

        {/* Mobile toggle */}
        <button
          onClick={() => setShowMobileGroups(!showMobileGroups)}
          className="lg:hidden fixed top-20 left-4 z-30 cursor-pointer text-white p-2 rounded-lg shadow-lg hover:shadow-xl transition-colors"
        >
          <img src="/group_icon.png" alt="Groups" className="w-5 h-5" />
        </button>

        {showMobileGroups && (
          <div className="lg:hidden fixed inset-0 bg-black bg-opacity-25 z-40" onClick={() => setShowMobileGroups(false)} />
        )}

        {/* Mobile panel */}
        <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white transform transition-transform duration-300 ease-in-out ${showMobileGroups ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 flex-shrink-0 bg-blue-400">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Groups</h2>
                <button onClick={() => setShowMobileGroups(false)} className="text-white hover:bg-blue-500 rounded-md p-1 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="relative mt-4">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-full pb-4">
              {filteredGroups.map(renderGroupItem)}
            </div>
          </div>
        </div>

        {/* Desktop panel */}
        <div className="hidden lg:flex lg:w-1/4 bg-white border-r border-gray-200 flex-col min-h-0">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Groups</h2>
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto max-h-full" style={{ paddingBottom: '110px' }}>
            {filteredGroups.map(renderGroupItem)}
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 flex flex-col w-full lg:w-auto min-h-0">
          <ChatWindow
            group={selectedGroup}
            messages={messages}
            typingUsers={typingUsers}
            sendMessage={sendMessage}
            startTyping={startTyping}
            stopTyping={stopTyping}
            isConnected={isConnected}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Community;
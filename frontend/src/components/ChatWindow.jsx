import React, { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";

export default function ChatWindow({ group, messages = [] }) {
  const [showPicker, setShowPicker] = useState(false);
  const [message, setMessage] = useState("");
  const pickerRef = useRef(null);

  // Sample messages data matching the Figma design
  const sampleMessages = [
    {
      id: 1,
      date: "10 June 2025",
      type: "date"
    },
    {
      id: 2,
      sender: "Usama",
      phone: "+92 300 1234567",
      message: "I've been struggling with motivation lately. Even small tasks feel overwhelming.",
      time: "8:26 pm",
      isOwn: false,
      avatar: "https://avatar.iran.liara.run/public/25"
    },
    {
      id: 3,
      sender: "Tayyab",
      phone: "+92 301 2345678",
      message: "I can relate to that. Have you tried breaking tasks into smaller chunks?",
      time: "8:30 pm",
      isOwn: false,
      avatar: "https://avatar.iran.liara.run/public/98"
    },
    {
      id: 4,
      date: "Yesterday",
      type: "date"
    },
    {
      id: 5,
      sender: "-Ali",
      phone: "+92 302 3456789",
      message: "Sometimes just talking about it helps. Anyone here tried journaling?",
      time: "6:52 pm",
      isOwn: false,
      avatar: "https://avatar.iran.liara.run/public/89"
    },
    {
      id: 6,
      sender: "-Rehman",
      phone: "+92 303 4567890",
      message: "Sometimes just talking about it helps. Anyone here tried journaling or daily reflections?",
      time: "6:52 pm",
      isOwn: true
    },
    {
      id: 7,
      date: "Today",
      type: "date"
    },
    {
      id: 8,
      sender: "Usama",
      phone: "+92 300 1234567",
      message: "I started journaling last week. It's been helpful for organizing my thoughts.",
      time: "2:15 pm",
      isOwn: false,
      avatar: "https://avatar.iran.liara.run/public/25"
    }
  ];

  // Reset input when group changes
  useEffect(() => {
    setMessage("");
    setShowPicker(false);
  }, [group]);

  // Handle emoji selection
  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPicker]);

  if (!group) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-600">Select a group to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <img
            src={group.avatar}
            alt={group.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {group.name}
            </h3>
            <p className="text-sm text-gray-500">you, Tayyab, usama, ~adeel, ...</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
        {sampleMessages.map((msg) => {
          if (msg.type === "date") {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                  {msg.date}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-2 max-w-xs ${msg.isOwn ? "flex-row-reverse" : ""}`}>
                {!msg.isOwn && (
                  <img
                    src={msg.avatar}
                    alt={msg.sender}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div className={`${msg.isOwn ? "text-right" : "text-left"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-blue-600">{msg.sender}</span>
                    <span className="text-xs text-gray-400">{msg.phone}</span>
                  </div>
                  <div
                    className={`p-3 rounded-lg ${
                      msg.isOwn 
                        ? "bg-blue-100 text-gray-800" 
                        : "bg-white text-gray-800 shadow-sm"
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className={`text-xs text-gray-400 mt-1 ${msg.isOwn ? "text-left" : "text-right"}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-gray-100 border-t border-gray-200">
        <div className="flex items-center gap-3">
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setShowPicker((prev) => !prev)}
            className="p-2 hover:bg-gray-200 rounded-full cursor-pointer"
          >
            <span className="text-xl">😊</span>
          </button>

          {/* Emoji Popup */}
          {showPicker && (
            <div ref={pickerRef} className="absolute bottom-20 left-4 z-50">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}

          {/* Input Field */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1 bg-white px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Send Button */}
          <button className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z"
                fill="white"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
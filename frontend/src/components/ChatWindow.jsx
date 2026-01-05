
import React, { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";
import axios from "axios";
import AppModal from "./AppModal";

export default function ChatWindow({ group, messages = [], typingUsers = [], sendMessage, startTyping, stopTyping, isConnected }) {
  const [showPicker, setShowPicker] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userData, setUserData] = useState(null);
  const [reportedMessageIds, setReportedMessageIds] = useState(new Set());
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [reportLoadingId, setReportLoadingId] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const pickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // socket state/actions are passed from parent to avoid creating multiple socket instances

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5001";
        const response = await axios.get(`${backendUrl}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const user = response.data?.user;
        if (user) {
          // Determine profile photo based on gender
          let avatarPhoto = '/user.jpg'; // default for male or no gender
          if (user.gender && user.gender.toLowerCase() === 'female') {
            avatarPhoto = '/user2.png';
          }
          
          setUserData({
            sender: user.fullName || "Anonymous",
            avatar: user.profilePhoto || avatarPhoto,
            phone: user.phone || "",
            userId: user._id || user.id,
          });
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        // Use fallback
        setUserData({
          sender: "Anonymous",
          avatar: "/user.jpg",
          phone: "",
          userId: "anonymous_" + Date.now(),
        });
      }
    };

    loadUserData();
  }, []);

  // Reset input when group changes
  useEffect(() => {
    setMessage("");
    setShowPicker(false);
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [group]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize reported message ids from server-provided flag
  useEffect(() => {
    const ids = new Set();
    messages.forEach((m) => {
      if (m.reportedByCurrentUser) ids.add(String(m.id));
    });
    setReportedMessageIds(ids);
  }, [messages]);

  // Clear toast after a short time
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(""), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowPicker(false);
  };

  // Handle typing indicator
  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    if (!group || !isConnected) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing indicator
    if (value.trim().length > 0 && !isTyping) {
      setIsTyping(true);
      startTyping(group.id);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
        if (isTyping) {
        setIsTyping(false);
        stopTyping(group.id);
      }
    }, 2000);
  };

  // Handle send message
  const handleSendMessage = (e) => {
    e?.preventDefault();

  (async () => {
    if (!group || !message.trim() || !isConnected) return;

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      stopTyping(group.id);
    }

    // Send message via Socket.IO (await ack)
    try {
      const ok = await sendMessage(group.id, message);
      if (ok) {
        setMessage("");
        setShowPicker(false);
      } else {
        console.error('Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  })();
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Close emoji picker on outside click
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

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  // Format time for message bubble
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Group messages by date
  const groupMessagesByDate = (msgs) => {
    const grouped = [];
    let currentDate = null;

    msgs.forEach((msg) => {
      const msgDate = msg.timestamp
        ? formatDate(msg.timestamp)
        : msg.date || "Today";

      if (msgDate !== currentDate) {
        grouped.push({
          id: `date-${msgDate}`,
          type: "date",
          date: msgDate,
        });
        currentDate = msgDate;
      }

      grouped.push(msg);
    });

    return grouped;
  };

  if (!group) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-600">
            Select a group to start chatting
          </p>
          {!isConnected && (
            <p className="text-sm text-gray-400 mt-2">
              Connecting to chat server...
            </p>
          )}
        </div>
      </div>
    );
  }

  // add readable time to messages and group by date
  const withTimes = messages.map((m) => ({ ...m, time: formatTime(m.timestamp) }));
  const displayMessages = groupMessagesByDate(withTimes);

  // Open report confirmation modal for a message
  const openReportModal = (msg) => {
    setReportTarget(msg);
    setShowReportModal(true);
  };

  // Confirm and send report to backend
  async function handleConfirmReport() {
    if (!reportTarget) return;
    const messageId = reportTarget.id || reportTarget._id || reportTarget._id;
    try {
      setReportLoadingId(messageId);
      const token = localStorage.getItem("authToken");
      if (!token) {
        setToastMessage("You must be logged in to report messages.");
        setReportLoadingId(null);
        return;
      }
      const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5001";
      const res = await fetch(`${backendUrl}/api/messages/${messageId}/report-abuse`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      if (!res.ok) {
        setToastMessage(j.message || "Error reporting message");
        setReportLoadingId(null);
        return;
      }
      setReportedMessageIds((prev) => {
        const s = new Set(prev);
        s.add(String(messageId));
        return s;
      });
      setToastMessage("Message reported");
      setShowReportModal(false);
      setReportTarget(null);
    } catch (err) {
      console.error("reportAbuse error", err);
      setToastMessage("Error reporting message");
    } finally {
      setReportLoadingId(null);
    }
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
            onError={(e) => { e.target.src = '/user.jpg'; }}
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {group.name}
            </h3>
            <p className="text-sm text-gray-500">
              {typingUsers.length > 0
                ? `${typingUsers.join(", ")} ${typingUsers.length === 1 ? "is" : "are"} typing...`
                : isConnected
                ? "Connected"
                : "Connecting..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
        {displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          displayMessages.map((msg) => {
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
                <div
                  className={`flex gap-2 max-w-xs ${msg.isOwn ? "flex-row-reverse" : ""}`}
                >
                  {!msg.isOwn && (
                    <img
                      src={msg.avatar || "/user.jpg"}
                      alt={msg.sender}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => { e.target.src = '/user.jpg'; }}
                    />
                  )}
                  <div className={`${msg.isOwn ? "text-right" : "text-left"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-blue-600">
                        {msg.sender}
                      </span>
                      {msg.phone && (
                        <span className="text-xs text-gray-400">{msg.phone}</span>
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        msg.isOwn
                          ? "bg-blue-100 text-gray-800"
                          : "bg-white text-gray-800 shadow-sm"
                      } relative`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p
                        className={`text-xs text-gray-400 mt-1 ${
                          msg.isOwn ? "text-left" : "text-right"
                        }`}
                      >
                        {msg.time}
                      </p>

                      {/* Report / Actions menu for non-own messages */}
                      {!msg.isOwn && userData?.userId && (
                        <div className="absolute top-1 right-1">
                          <div className="relative">
                            <button
                              className="p-1 hover:bg-gray-100 rounded"
                              onClick={async (e) => {
                                e.stopPropagation();
                                // Fetch latest message info from backend to check reportedByCurrentUser
                                try {
                                  const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || "http://localhost:5001";
                                  const token = localStorage.getItem("authToken");
                                  const headers = token ? { Authorization: `Bearer ${token}` } : {};
                                  const res = await fetch(`${backendUrl}/api/messages/${msg.id}`, { headers });
                                  if (res.ok) {
                                    const j = await res.json();
                                    const remoteMsg = j.message;
                                    if (remoteMsg?.reportedByCurrentUser) {
                                      setReportedMessageIds((prev) => {
                                        const s = new Set(prev);
                                        s.add(String(msg.id));
                                        return s;
                                      });
                                    }
                                  }
                                } catch (err) {
                                  console.error('Error fetching message status', err);
                                }
                                setActiveMenuId((prev) => (prev === msg.id ? null : msg.id));
                              }}
                              title="Message actions"
                            >
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v.01M12 12v.01M12 18v.01" />
                              </svg>
                            </button>

                            {activeMenuId === msg.id && (
                              <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded border overflow-hidden z-20">
                                {reportedMessageIds.has(String(msg.id)) ? (
                                  <div className="px-3 py-2 text-sm text-gray-500">Reported</div>
                                ) : (
                                  <button
                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuId(null);
                                      openReportModal(msg);
                                    }}
                                    disabled={reportLoadingId === msg.id}
                                  >
                                    {reportLoadingId === msg.id ? "Reporting..." : "Report Message"}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Report Confirmation Modal */}
      <AppModal
        isOpen={showReportModal}
        onClose={() => {
          if (!reportLoadingId) {
            setShowReportModal(false);
            setReportTarget(null);
          }
        }}
        title="Report Message"
        widthClass="max-w-md"
      >
        <p className="text-sm text-gray-600 mb-4">Are you sure you want to report this message? This action will notify moderators for review.</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => { setShowReportModal(false); setReportTarget(null); }}
            className="px-4 py-2 bg-gray-200 rounded"
            disabled={!!reportLoadingId}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmReport}
            className="px-4 py-2 bg-red-600 text-white rounded"
            disabled={!!reportLoadingId}
          >
            {reportLoadingId ? "Reporting..." : "Report"}
          </button>
        </div>
      </AppModal>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-gray-900 text-white px-4 py-2 rounded shadow">{toastMessage}</div>
        </div>
      )}

      {/* Chat Input */}
      <div className="p-4 bg-gray-100 border-t border-gray-200 relative">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
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
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isConnected ? "Type a message" : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 bg-white px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!isConnected || !message.trim()}
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
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
        </form>
      </div>
    </div>
  );
}

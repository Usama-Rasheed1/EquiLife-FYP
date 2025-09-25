import React, { useState, useRef, useEffect } from "react";
import EmojiPicker from "emoji-picker-react";

export default function ChatWindow({ group, messages = [] }) {
  const [showPicker, setShowPicker] = useState(false);
  const [message, setMessage] = useState("");
  const pickerRef = useRef(null);

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
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a group to start chatting
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b pb-2 mb-2">
        <div className="flex items-center gap-4">
          <img
            src={group.avatar}
            alt={group.name}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="text-lg text-gray-600 font-semibold">
              {group.name}
            </h3>
            <p className="text-sm text-gray-400">Usama, Tayyab, ...</p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-lg space-y-4">
        {messages.length === 0 ? (
          <p className="text-gray-600">
            Chat with <span className="font-semibold">{group.name}</span> will
            appear here...
          </p>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg shadow text-sm ${
                  msg.isOwn ? "bg-blue-100 text-right" : "bg-gray-100 text-left"
                }`}
              >
                <p className="font-semibold text-blue-600">{msg.sender}</p>
                <p className="text-gray-800">{msg.text}</p>
                <p className="text-xs text-gray-400 mt-1">{msg.time}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat Input */}
      <div className="mt-4 flex items-center bg-gray-300 gap-2 relative p-2">
        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowPicker((prev) => !prev)}
          className="p-1 rounded-lg hover:bg-blue-100 cursor-pointer text-2xl"
        >
          😊
        </button>

        {/* Emoji Popup */}
        {showPicker && (
          <div ref={pickerRef} className="absolute bottom-12 left-0 z-50">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}

        {/* Input Field */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          className="flex-1 bg-white px-3 py-2 rounded-md"
        />

        {/* Send Button */}
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
          <svg
            width="20"
            height="20"
            viewBox="0 0 26 26"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.34493 11.7078C6.79069 11.7078 5.23563 11.7029 3.68138 11.7135C3.46028 11.7151 3.3668 11.6451 3.2977 11.4367C2.24013 8.23977 1.17443 5.0461 0.106295 1.85326C-0.0887987 1.27037 -0.0367737 0.742031 0.442831 0.325218C0.92081 -0.0907796 1.45081 -0.0785683 2.00277 0.197407C9.73254 4.0635 17.4631 7.92634 25.1937 11.79C25.6993 12.0432 26.0033 12.4282 26.0001 13.0111C25.996 13.6079 25.6684 13.9799 25.1531 14.2371C18.4565 17.5814 11.7615 20.9297 5.06655 24.2773C4.0228 24.7991 2.9823 25.325 1.93448 25.8395C1.13704 26.2311 0.25668 25.881 0.0599602 25.0629C-0.00913545 24.7763 0.0282575 24.4295 0.12174 24.1446C0.935443 21.6478 1.77272 19.1583 2.60349 16.6664C2.83435 15.9736 3.07741 15.2849 3.2912 14.5872C3.36029 14.3609 3.4619 14.2933 3.69439 14.2941C6.7224 14.3023 9.74961 14.2998 12.7776 14.2974C12.9695 14.2974 13.1686 14.2974 13.3515 14.2485C13.9929 14.0784 14.3717 13.4743 14.2823 12.7995C14.2026 12.1962 13.6799 11.7192 13.0386 11.7143C11.4737 11.7029 9.90893 11.7102 8.34493 11.7102C8.34493 11.7086 8.34493 11.7078 8.34493 11.7078Z"
              fill="white"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
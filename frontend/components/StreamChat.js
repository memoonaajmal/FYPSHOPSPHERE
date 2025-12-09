"use client";

import { useEffect, useState, useRef } from "react";

export default function StreamChat({ streamId, username, userType, socket }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [pinnedMessage, setPinnedMessage] = useState(null);

  const seen = useRef(new Set());

  // Helper to produce a stable message key
  function msgKey(msg) {
    if (!msg) return "";
    if (msg._id) return `_id:${msg._id}`;
    return `f:${msg.user}::${msg.text}::${msg.createdAt || ""}`;
  }

  useEffect(() => {
    if (!socket) {
      console.warn("No socket passed to StreamChat!");
      return;
    }

    console.log("Chat socket connected:", socket.id, "for", userType);

    const handleMessage = (msg) => {
      console.log(" Received chat-message:", msg);

      const key = msgKey(msg);
      if (seen.current.has(key)) {
        console.log(" Duplicate message ignored:", key);
        return;
      }
      seen.current.add(key);

      // If the message is from the seller
      if (msg.userType === "seller") {
        // Always pin it
        setPinnedMessage(msg);

        // NEVER add seller message to the main chat list
        return;
      }

      // Otherwise (viewer messages)
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chat-message", handleMessage);
    return () => socket.off("chat-message", handleMessage);
  }, [socket]);

  const sendMessage = () => {
    if (!text.trim() || !socket) return;

    const msg = {
      user: username,
      text,
      streamId,
      userType,
      createdAt: new Date().toISOString(),
    };

    console.log("Emitting chat-message:", msg);
    socket.emit("chat-message", msg);
    setText("");
  };

  return (
    <div className="w-full max-w-md border rounded-lg p-3 mt-4 bg-white shadow">
      <h3 className="font-semibold mb-2">Live Chat</h3>

      {/* Pinned seller message */}
      {pinnedMessage && (
        <div className="bg-gradient-to-r from-pink-100 to-purple-100 text-gray-800 p-2 rounded-lg mb-2 shadow-sm">
          <strong className="text-pink-600">{pinnedMessage.user}</strong>:{" "}
          {pinnedMessage.text}
        </div>
      )}

      {/* Chat list (only viewer messages) */}
      <div className="h-64 overflow-y-auto border rounded p-2 mb-2 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm italic">No messages yet...</p>
        )}
        {messages.map((m, i) => (
          <p key={msgKey(m) + "-" + i}>
            <strong>{m.user}:</strong> {m.text}
          </p>
        ))}
      </div>

      {/* Input for both seller and viewers */}
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-grow border rounded p-2"
          placeholder={
            userType === "seller"
              ? "Type a message to pin..."
              : "Type a message..."
          }
        />
        <button
          onClick={sendMessage}
          className={`rounded px-3 py-1 transition ${
            userType === "seller"
              ? "bg-pink-600 text-white hover:bg-pink-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}

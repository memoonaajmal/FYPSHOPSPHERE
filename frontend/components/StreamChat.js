"use client";

import { useEffect, useState, useRef } from "react";

export default function StreamChat({ streamId, username, userType, socket }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [pinnedMessage, setPinnedMessage] = useState(null);

  const seen = useRef(new Set());

  function msgKey(msg) {
    if (!msg) return "";
    if (msg._id) return `_id:${msg._id}`;
    return `f:${msg.user}::${msg.text}::${msg.createdAt || ""}`;
  }

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      // ✅ SELLER MESSAGE: ALWAYS PIN & REPLACE
      if (msg.userType === "seller") {
        setPinnedMessage(msg);
        return; // ❗ never add to chat list
      }

      // ⛔ Dedup ONLY for viewer messages
      const key = msgKey(msg);
      if (seen.current.has(key)) return;
      seen.current.add(key);

      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chat-message", handleMessage);
    return () => socket.off("chat-message", handleMessage);
  }, [socket]);

  const sendMessage = () => {
    if (!text.trim() || !socket) return;

    socket.emit("chat-message", {
      user: username,
      text,
      streamId,
      userType,
      createdAt: new Date().toISOString(),
    });

    setText("");
  };

  return (
    <div className="w-full max-w-md border rounded-lg p-3 mt-4 bg-white shadow">
      <h3 className="font-semibold mb-2">Live Chat</h3>

      {/* 📌 PINNED SELLER MESSAGE */}
      {pinnedMessage && (
        <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-2 rounded-lg mb-2 shadow-sm">
          <strong className="text-pink-600">
            {pinnedMessage.user}
          </strong>
          : {pinnedMessage.text}
        </div>
      )}

      {/* Viewer messages only */}
      <div className="h-64 overflow-y-auto border rounded p-2 mb-2 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm italic">
            No messages yet...
          </p>
        )}
        {messages.map((m, i) => (
          <p key={msgKey(m) + i}>
            <strong>{m.user}:</strong> {m.text}
          </p>
        ))}
      </div>

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
          className={`rounded px-3 py-1 ${
            userType === "seller"
              ? "bg-pink-600 text-white"
              : "bg-blue-600 text-white"
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
}

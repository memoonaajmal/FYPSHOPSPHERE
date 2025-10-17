"use client";

import { useEffect, useState } from "react";

export default function StreamChat({ streamId, username, socket }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      if (username === "Seller" && msg.user === "Seller") return;
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chat-message", handleMessage);

    return () => {
      socket.off("chat-message", handleMessage);
    };
  }, [socket, username]);

  const sendMessage = () => {
    if (!text.trim()) return;
    socket.emit("chat-message", { user: username, text, streamId });
    setText("");
  };

  return (
    <div className="w-full max-w-md border rounded-lg p-3 mt-4 bg-white shadow">
      <h3 className="font-semibold mb-2">Live Chat</h3>

      <div className="h-64 overflow-y-auto border rounded p-2 mb-2 bg-gray-50">
        {messages.length === 0 && <p className="text-gray-500 text-sm italic">No messages yet...</p>}
        {messages.map((m, i) => (
          <p key={i}>
            <strong>{m.user}:</strong> {m.text}
          </p>
        ))}
      </div>

      {username !== "Seller" && (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-grow border rounded p-2"
            placeholder="Type a message..."
          />
          <button onClick={sendMessage} className="bg-blue-600 text-white rounded px-3 py-1">
            Send
          </button>
        </div>
      )}
    </div>
  );
}

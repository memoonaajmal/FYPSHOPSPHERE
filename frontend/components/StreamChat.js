"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";

// ✅ Use same WebSocket transport as other components
const socket = io(process.env.NEXT_PUBLIC_BASE_URL, { transports: ["websocket"] });

export default function StreamChat({ streamId, username }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!streamId) return;

    // ✅ Join the stream's chat room
    socket.emit("join-stream", { streamId });

    // ✅ Listen for incoming messages
    socket.on("chat-message", (msg) => {
      // Seller should not see their own messages
      if (username === "Seller" && msg.user === "Seller") return;
      setMessages((prev) => [...prev, msg]);
    });

    // ✅ Leave room and cleanup on unmount
    return () => {
      socket.emit("leave-stream", { streamId });
      socket.off("chat-message");
    };
  }, [username, streamId]);

  // ✅ Send message (for viewers only)
  const sendMessage = () => {
    if (text.trim() === "") return;
    const msg = { user: username, text, streamId };
    socket.emit("chat-message", msg);
    setText("");
  };

  return (
    <div className="w-full max-w-md border rounded-lg p-3 mt-4 bg-white shadow">
      <h3 className="font-semibold mb-2">Live Chat</h3>

      {/* Chat messages */}
      <div className="h-64 overflow-y-auto border rounded p-2 mb-2 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm italic">No messages yet...</p>
        )}
        {messages.map((m, i) => (
          <p key={i}>
            <strong>{m.user}:</strong> {m.text}
          </p>
        ))}
      </div>

      {/* ✅ Show input only for viewers (not sellers) */}
      {username !== "Seller" && (
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-grow border rounded p-2"
            placeholder="Type a message..."
          />
          <button
            onClick={sendMessage}
            className="bg-blue-600 text-white rounded px-3 py-1"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import io from "socket.io-client";
import { auth } from "../../../../firebase/config";
import StreamPublisher from "../../../../components/StreamPublisher";
import StreamChat from "../../../../components/StreamChat";

// ✅ Initialize socket connection once
const socket = io(process.env.NEXT_PUBLIC_BASE_URL, { transports: ["websocket"] });

export default function GoLivePage() {
  const [title, setTitle] = useState("");
  const [stream, setStream] = useState(null);
  const [sellerId, setSellerId] = useState(null);

  // ✅ Load saved stream from localStorage (if exists)
  useEffect(() => {
    const saved = localStorage.getItem("activeStream");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log("🧠 Restored saved stream:", parsed);
        setStream(parsed);
      } catch (err) {
        console.warn("⚠️ Could not parse saved stream:", err);
      }
    }
  }, []);

  // ✅ Get current Firebase user ID
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setSellerId(user.uid);
        console.log("✅ Seller logged in:", user.uid);
      } else {
        console.log("⚠️ No seller logged in");
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ Handle reconnects to same stream after refresh
  useEffect(() => {
    if (stream?._id) {
      const handleReconnect = () => {
        socket.emit("reconnect-seller", { streamId: stream._id });
        console.log("🔄 Reconnected to stream:", stream._id);
      };

      socket.on("connect", handleReconnect);
      handleReconnect();

      return () => socket.off("connect", handleReconnect);
    }
  }, [stream?._id]);

  // ✅ Start new stream
  const startStream = async () => {
    if (!title.trim()) return alert("Please enter a stream title");
    if (!sellerId) return alert("You must be logged in to start streaming");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/streams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, sellerId }),
      });

      const data = await res.json();
      if (data?._id) {
        console.log("✅ Stream created:", data);
        setStream(data);
        localStorage.setItem("activeStream", JSON.stringify(data));
        socket.emit("start-stream", { streamId: data._id });
      } else {
        console.error("❌ Stream creation failed:", data);
      }
    } catch (err) {
      console.error("🔥 Error creating stream:", err);
    }
  };

  // ✅ End stream completely
  const endStream = async () => {
    if (!stream?._id) return;

    if (!confirm("Are you sure you want to end your live stream?")) return;

    try {
      // 🟥 End stream on backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/streams/${stream._id}/end`, {
        method: "POST",
      });

      const data = await res.json();
      if (data.success) {
        console.log("🛑 Stream ended successfully:", stream._id);

        // 🔔 Notify all viewers via socket
        socket.emit("end-stream", { streamId: stream._id });
        socket.emit("stream-ended", { streamId: stream._id });

        // 🧹 Cleanup local storage + reset UI
        localStorage.removeItem("activeStream");
        setStream(null);
        setTitle("");
        alert("✅ Live stream ended successfully!");
      } else {
        console.error("❌ Backend failed to end stream:", data);
      }
    } catch (err) {
      console.error("🔥 Error ending stream:", err);
    }
  };

  // ✅ Render live stream view
  if (stream) {
    return (
      <div className="p-6 flex flex-col items-center">
        <h1 className="text-xl font-semibold mb-3">{stream.title}</h1>
<StreamPublisher streamId={stream._id} isStreamActive={!!stream} />
        <StreamChat streamId={stream._id} username="Seller" />

        {/* 🔴 End Stream Button */}
        <button
          onClick={endStream}
          className="mt-5 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          End Stream
        </button>
      </div>
    );
  }

  // ✅ Render setup screen
  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Start Live Stream</h1>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border rounded p-2 mb-3"
        placeholder="Enter stream title"
      />
      <button
        onClick={startStream}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Go Live
      </button>
    </div>
  );
}

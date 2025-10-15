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

  // ✅ Load saved stream (if any) immediately when component mounts
  useEffect(() => {
    const saved = localStorage.getItem("activeStream");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log("🧠 Restored saved stream from localStorage:", parsed);
        setStream(parsed);
      } catch (err) {
        console.warn("⚠️ Failed to parse saved stream:", err);
      }
    }
  }, []);

  // ✅ Get current Firebase user ID
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setSellerId(user.uid);
        console.log("✅ Logged-in Seller UID:", user.uid);
      } else {
        console.log("⚠️ No user logged in");
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ Handle reconnects to same stream after refresh
  useEffect(() => {
    if (stream?._id) {
      const handleReconnect = () => {
        socket.emit("reconnect-seller", { streamId: stream._id });
        console.log("🔄 Seller reconnected to existing stream:", stream._id);
      };

      socket.on("connect", handleReconnect);
      handleReconnect(); // Run immediately

      return () => socket.off("connect", handleReconnect);
    }
  }, [stream?._id]);

  // ✅ Start live stream (seller side)
  const startStream = async () => {
    if (!title.trim()) {
      alert("Please enter a stream title");
      return;
    }

    if (!sellerId) {
      alert("You must be logged in to start streaming");
      return;
    }

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
        localStorage.setItem("activeStream", JSON.stringify(data)); // ✅ Save locally
        socket.emit("start-stream", { streamId: data._id });
      } else {
        console.error("❌ Failed to create stream:", data);
      }
    } catch (err) {
      console.error("🔥 Error creating stream:", err);
    }
  };

  // ✅ Render live stream page once started
  if (stream) {
    return (
      <div className="p-6 flex flex-col items-center">
        <h1 className="text-xl font-semibold mb-3">{stream.title}</h1>
        <StreamPublisher streamId={stream._id} />
        <StreamChat streamId={stream._id} username="Seller" />
      </div>
    );
  }

  // ✅ Render setup form before going live
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

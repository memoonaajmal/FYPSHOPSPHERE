"use client";

import { useState, useEffect, useRef } from "react";
import { auth } from "../../../../firebase/config";
import { getSocket } from "../../../../lib/socket";
import StreamPublisher from "../../../../components/StreamPublisher";
import StreamChat from "../../../../components/StreamChat";
import styles from "../styles/GoLive.module.css";


export default function GoLivePage() {
  const [title, setTitle] = useState("");
  const [stream, setStream] = useState(null);
  const [sellerId, setSellerId] = useState(null);
  const [sellerName, setSellerName] = useState("Seller");

  const publisherRef = useRef(null);
  const socketRef = useRef(null);
  const hasConnectedRef = useRef(false);

  // Get seller Firebase info
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setSellerId(user.uid);
        setSellerName(user.displayName || user.email?.split("@")[0] || "Seller");
      }
    });
    return () => unsubscribe();
  }, []);

  // Restore saved stream
  useEffect(() => {
    const saved = localStorage.getItem("activeStream");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStream(parsed);
        if (!socketRef.current) {
          socketRef.current = getSocket("seller", parsed._id);
        }
      } catch (err) {
        console.warn(" Could not parse saved stream:", err);
      }
    }
  }, []);

  // Reconnect socket
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !stream?._id || hasConnectedRef.current) return;

    const handleReconnect = () => {
      socket.emit("reconnect-seller", { streamId: stream._id });
      hasConnectedRef.current = true;
    };

    socket.on("connect", handleReconnect);
    handleReconnect();

    return () => socket.off("connect", handleReconnect);
  }, [stream?._id]);

  const startStream = async () => {
    if (!title.trim()) return alert("Please enter a stream title");
    if (!sellerId) return alert("You must be logged in");

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/streams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, sellerId }),
    });
    const data = await res.json();
    if (!data?._id) return console.error("Stream creation failed:", data);

    setStream(data);
    localStorage.setItem("activeStream", JSON.stringify(data));

    if (!socketRef.current) {
      socketRef.current = getSocket("seller", data._id);
    }

    if (!hasConnectedRef.current) {
      socketRef.current.emit("start-stream", { streamId: data._id });
      hasConnectedRef.current = true;
    }
  };

  const endStream = async () => {
    if (!stream?._id) return;
    if (!confirm("Are you sure you want to end your live stream?")) return;

    const socket = socketRef.current;
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/streams/${stream._id}/end`, {
      method: "POST",
    });
    const data = await res.json();

    if (data.success) {
      socket?.emit("end-stream", { streamId: stream._id });
      if (publisherRef.current?.cleanupStream) await publisherRef.current.cleanupStream();

      setTimeout(() => {
        localStorage.removeItem("activeStream");
        setStream(null);
        setTitle("");
        hasConnectedRef.current = false;
        alert("Stream ended successfully!");
      }, 300);
    }
  };

  if (stream) {
  return (
  <div className={styles.liveStreamPage}>
    <div className={styles.publisherContainer}>

      {/* LEFT: Video + controls */}
      <div className={styles.videoPanel}>
        <StreamPublisher
          ref={publisherRef}
          streamId={stream._id}
          isStreamActive={!!stream}
          socket={socketRef.current}
          streamTitle={stream.title}
          storeName={sellerName}
        >
          {/* Pass End Stream button as children */}
          <button onClick={endStream} className={styles.endStreamBtn}>
            End Stream
          </button>
        </StreamPublisher>
      </div>

      {/* RIGHT: Chat */}
      <div className={styles.chatPanel}>
        <StreamChat
          streamId={stream._id}
          username={sellerName}
          userType="seller"
          socket={socketRef.current}
        />
      </div>

    </div>
  </div>
);
}

  return (
    <div className={styles.liveStreamPage}>
  <div className={styles.liveStream}>
    <img
      src="/images/livestream.png"
      alt="Live Stream"
      className={styles.liveStreamImage}
    />
    <h1>Ready to Broadcast?</h1>
    <p>Begin streaming and engage with your audience. Showcase products and answer questions live.</p>
    <div className={styles.liveStreamControls}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={styles.liveStreamInput}
        placeholder="Enter stream title"
      />
      <button
        onClick={startStream}
        className={styles.liveStreamBtn}
      >
        Go Live
      </button>
    </div>
  </div>
</div>
  );
}
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { getSocket } from "../../../../../lib/socket";
import StreamViewer from "../../../../../components/StreamViewer";
import StreamChat from "../../../../../components/StreamChat";

export default function LiveStreamPage() {
  const { slug } = useParams();
  const [stream, setStream] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const socketRef = useRef(null); // single socket for the viewer

  // ✅ Fetch stream info
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/streams/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setStream(data);
        setIsLive(data?.status === "live");
      })
      .catch(console.error);
  }, [slug]);

  // ✅ Setup socket for viewer
  useEffect(() => {
    if (!stream?._id) return;

    // Create new socket if not already
    if (!socketRef.current) {
      socketRef.current = getSocket("viewer", stream._id);
    }

    const socket = socketRef.current;

    // Join stream
    socket.emit("join-stream", { streamId: stream._id });
    console.log("👀 Viewer joined stream:", stream._id);

    // Stream events
    const handleStreamEnd = () => {
      setIsLive(false);
      console.log("📴 Stream ended by seller");
    };

    const handleStreamStart = () => {
      setIsLive(true);
      console.log("🎥 Stream started again by seller");
      // Rejoin if previously left
      socket.emit("join-stream", { streamId: stream._id });
    };

    socket.on("stream-ended", handleStreamEnd);
    socket.on("live-started", handleStreamStart);

    return () => {
      // Leave room and remove listeners (keep socket alive)
      socket.emit("leave-stream", { streamId: stream._id });
      socket.off("stream-ended", handleStreamEnd);
      socket.off("live-started", handleStreamStart);
      console.log("👋 Viewer left room, socket still alive");
    };
  }, [stream?._id]);

  if (!stream) return <p className="p-6">Loading stream...</p>;

  return (
    <div className="p-6 flex flex-col items-center">
      <h1 className="text-2xl font-semibold mb-4">{stream.title}</h1>

      {isLive ? (
        <>
          <StreamViewer streamId={stream._id} socket={socketRef.current} />
          <StreamChat streamId={stream._id} username="Viewer" socket={socketRef.current} />
        </>
      ) : (
        <p className="text-gray-500">
          Stream has ended. Waiting for seller to go live again...
        </p>
      )}
    </div>
  );
}

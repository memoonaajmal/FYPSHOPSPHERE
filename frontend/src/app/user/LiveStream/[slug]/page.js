"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { auth } from "../../../../../firebase/config"; 
import { getSocket } from "../../../../../lib/socket";
import StreamViewer from "../../../../../components/StreamViewer";
import StreamChat from "../../../../../components/StreamChat";

export default function LiveStreamPage() {
  const { slug } = useParams();
  const [stream, setStream] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [userName, setUserName] = useState("Guest");
  const socketRef = useRef(null);

  // Get logged-in user's display name or email
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserName(user.displayName || user.email?.split("@")[0] || "Anonymous");
      } else {
        setUserName("Guest");
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch stream info
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/streams/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setStream(data);
        setIsLive(data?.status === "live");
      })
      .catch(console.error);
  }, [slug]);

  // Setup socket connection (create fresh socket on each join; clean previous)
useEffect(() => {
  if (!stream?._id) return;

  // If there's an existing socket, fully disconnect it before creating a new one.
  if (socketRef.current) {
    try {
      // inform server we are leaving (best-effort)
      socketRef.current.emit("leave-stream", { streamId: stream._id });
    } catch (e) {}
    // fully disconnect the socket (removes server-side listeners for this socket.id)
    try {
      socketRef.current.disconnect();
    } catch (e) {}
    socketRef.current = null;
  }

  // Create a fresh socket instance for this join
  const socket = getSocket("viewer", stream._id);
  socketRef.current = socket;

  // Wait until socket is connected, then join the stream room
  const onConnect = () => {
    console.log("[viewer] connected for stream", stream._id, "socket id:", socket.id);
    socket.emit("join-stream", { streamId: stream._id });
    console.log("Viewer joined stream:", stream._id);
  };

  // attach listeners
  socket.on("connect", onConnect);

  // handle stream state updates
  socket.on("stream-ended", () => setIsLive(false));
  socket.on("live-started", () => setIsLive(true));
  // optional: handle paused/resumed if you emit those from server
  socket.on("stream-paused", () => setIsLive(false));

  // In case the socket is already connected right away
  if (socket.connected) onConnect();

  // cleanup when component unmounts or stream id changes
  return () => {
    try {
      socket.emit("leave-stream", { streamId: stream._id });
    } catch (e) {}
    socket.off("connect", onConnect);
    socket.off("stream-ended");
    socket.off("live-started");
    socket.off("stream-paused");
    try {
      socket.disconnect();
    } catch (e) {}
    // clear reference
    if (socketRef.current === socket) socketRef.current = null;
    console.log("Viewer cleanup done for stream:", stream._id);
  };
}, [stream?._id]);


  if (!stream) return <p className="p-6">Loading stream...</p>;

  return (
    <div className="p-6 flex flex-col items-center">
      <h1 className="text-2xl font-semibold mb-2">{stream.title}</h1>
      <p className="text-gray-600 mb-4">
        By {stream.sellerName} ({stream.sellerEmail})
      </p>

      {isLive ? (
        <>
          <StreamViewer streamId={stream._id} socket={socketRef.current} />
          <StreamChat
  streamId={stream._id}
  username={userName}
  userType="viewer"
  socket={socketRef.current}
/>

        </>
      ) : (
        <p className="text-gray-500">
          Stream has ended. Waiting for seller to go live again...
        </p>
      )}
    </div>
  );
}

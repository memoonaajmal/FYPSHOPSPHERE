"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import io from "socket.io-client";
import StreamViewer from "../../../../../components/StreamViewer";
import StreamChat from "../../../../../components/StreamChat";

const socket = io(process.env.NEXT_PUBLIC_BASE_URL, { transports: ["websocket"] });

export default function LiveStreamPage() {
  const { slug } = useParams();
  const [stream, setStream] = useState(null);
  const [isLive, setIsLive] = useState(false);

  // ✅ Fetch stream info initially
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/streams/${slug}`)
      .then(res => res.json())
      .then(data => {
        setStream(data);
        setIsLive(data?.status === "live");
      })
      .catch(console.error);
  }, [slug]);

  // ✅ Listen for real-time updates
  useEffect(() => {
    if (!stream?._id) return;

    // Listen for seller starting stream again
    socket.on("stream-started", (data) => {
      if (data._id === stream._id) {
        console.log("🎥 Seller went live again!");
        setIsLive(true);
        // Re-fetch latest stream info
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/streams/${slug}`)
          .then(res => res.json())
          .then(setStream)
          .catch(console.error);
      }
    });

    // Listen for seller ending stream
    socket.on("stream-ended", (data) => {
      if (data._id === stream._id) {
        console.log("📴 Seller ended the stream.");
        setIsLive(false);
      }
    });

    return () => {
      socket.off("stream-started");
      socket.off("stream-ended");
    };
  }, [stream?._id, slug]);

  if (!stream) return <p className="p-6">Loading stream...</p>;

  return (
    <div className="p-6 flex flex-col items-center">
      <h1 className="text-2xl font-semibold mb-4">{stream.title}</h1>

      {isLive ? (
        <>
          <StreamViewer streamId={stream._id} />
          <StreamChat streamId={stream._id} username="Viewer" />
        </>
      ) : (
        <p className="text-gray-500">Stream has ended. Waiting for seller to go live again...</p>
      )}
    </div>
  );
}

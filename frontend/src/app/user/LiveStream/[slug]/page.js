"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "../../../../../firebase/config"; 
import { getSocket } from "../../../../../lib/socket";
import StreamViewer from "../../../../../components/StreamViewer";
import StreamChat from "../../../../../components/StreamChat";
import styles from "../../../seller/styles/GoLive.module.css";
import publisherStyles from "../../../../../components/styles/StreamPublisher.module.css";

export default function LiveStreamPage() {
  const { slug } = useParams();
  const [stream, setStream] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [userName, setUserName] = useState("Guest");
  const socketRef = useRef(null);
  const router = useRouter();
  const [viewerCount, setViewerCount] = useState(0);

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

  // Setup socket connection
  useEffect(() => {
    if (!stream?._id) return;

    // Cleanup old socket if any
    if (socketRef.current) {
      try { socketRef.current.emit("leave-stream", { streamId: stream._id }); } catch(e){}
      try { socketRef.current.disconnect(); } catch(e){}
      socketRef.current = null;
    }

    const socket = getSocket("viewer", stream._id);
    socketRef.current = socket;

    const onConnect = () => {
      console.log("[viewer] connected for stream", stream._id, "socket id:", socket.id);

      // Join stream with correct user name
      socket.emit("join-stream", { 
        streamId: stream._id,
        viewerName: userName
      });

      console.log("Viewer joined stream:", stream._id);
    };

    socket.on("connect", onConnect);

    // Handle stream state updates
    socket.on("stream-ended", () => {
      setIsLive(false); // triggers UI to show "stream ended" message
      alert("🔴 Live stream has ended by the seller"); // optional
      router.push("/user/LiveList");
    });
    socket.on("live-started", () => setIsLive(true));
    socket.on("stream-paused", () => setIsLive(false));

    if (socket.connected) onConnect();

    return () => {
      try { socket.emit("leave-stream", { streamId: stream._id }); } catch(e){}
      socket.off("connect", onConnect);
      socket.off("stream-ended");
      socket.off("live-started");
      socket.off("stream-paused");
      try { socket.disconnect(); } catch(e){}
      if (socketRef.current === socket) socketRef.current = null;
      console.log("Viewer cleanup done for stream:", stream._id);
    };
  }, [stream?._id, userName]);

  if (!stream) return <p className="p-6">Loading stream...</p>;

  return (
    <div className={styles.liveStreamPage}>
  <div className={styles.publisherContainer}>

    <div className={publisherStyles.videoPanel}>

  {/* VIDEO WRAP (same as seller) */}
  <div className={publisherStyles.videoWrap}>
    <StreamViewer
      streamId={stream._id}
      socket={socketRef.current}
      setViewerCount={setViewerCount}
    />

    {/* LIVE CHIP */}
    <div className={publisherStyles.vidOverlayTop}>
      <div className={publisherStyles.liveChip}>
        <span className={publisherStyles.reddot} />
        Live
      </div>
    </div>

    {/* SELLER INFO (same style) */}
    <div className={publisherStyles.vidOverlayBottom}>
      <div className={publisherStyles.sellerChip}>
        <div className={publisherStyles.sellerAvatar}>
          {stream.sellerName?.charAt(0)}
          <span className={publisherStyles.avatarRing} />
        </div>
        <div>
          <div className={publisherStyles.sellerName}>
            {stream.sellerName}
          </div>
          <div className={publisherStyles.sellerSub}>
            ShopSphere Seller
          </div>
        </div>
      </div>

      <button
        className={styles.endStreamBtn}
        onClick={() => router.back()}
      >
        Leave Stream
      </button>
    </div>
  </div>

  {/* INFO BAR (IMPORTANT — this fixes bottom mismatch) */}
  <div className={publisherStyles.infoBar}>
    <div>
      <div className={publisherStyles.streamTitle}>
        {stream.title}
      </div>
      <div className={publisherStyles.streamSub}>
        Live shopping · viewers can buy instantly
      </div>
    </div>

    <div
  className={publisherStyles.viewerButton}
  style={{
    pointerEvents: "none",
    cursor: "default",
    opacity: 0.7
  }}
>
  {viewerCount} watching
</div>
  </div>

</div>

    {/* RIGHT SIDE - CHAT */}
    <div className={styles.chatPanel}>
      <StreamChat
        streamId={stream._id}
        username={userName}
        userType="viewer"
        socket={socketRef.current}
      />
    </div>

  </div>
</div>
  );
}

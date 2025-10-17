"use client";

import { useEffect, useRef } from "react";

export default function StreamViewer({ streamId, socket }) {
  const videoRef = useRef();
  const peerRef = useRef(null);

  useEffect(() => {
    if (!socket || !streamId) return;

    // Function to create a fresh peer
    const createPeer = () => {
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peer.ontrack = (e) => {
        if (videoRef.current) videoRef.current.srcObject = e.streams[0];
      };

      peer.onicecandidate = (e) => {
        if (e.candidate && peer.sellerId) {
          socket.emit("ice-candidate", { target: peer.sellerId, candidate: e.candidate });
        }
      };

      return peer;
    };

    // Handle incoming offer from seller
    const handleOffer = async ({ sellerId, sdp }) => {
      // Close old peer if exists
      if (peerRef.current) {
        try { peerRef.current.close(); } catch (e) {}
        peerRef.current = null;
      }

      const peer = createPeer();
      peer.sellerId = sellerId;
      peerRef.current = peer;

      try {
        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("answer", { sellerId, sdp: answer });
      } catch (err) {
        console.error("❌ Error handling offer:", err);
      }
    };

    const handleICE = async ({ candidate }) => {
      if (candidate && peerRef.current) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("⚠️ Error adding ICE candidate:", err);
        }
      }
    };

    const handleEnd = () => {
      if (peerRef.current) peerRef.current.close();
      peerRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      console.log("🛑 Stream ended by seller");
    };

    socket.on("offer", handleOffer);
    socket.on("ice-candidate", handleICE);
    socket.on("stream-ended", handleEnd);

    socket.emit("join-stream", { streamId });
    console.log("👀 Viewer ready for stream:", streamId);

    return () => {
      socket.emit("leave-stream", { streamId });
      socket.off("offer", handleOffer);
      socket.off("ice-candidate", handleICE);
      socket.off("stream-ended", handleEnd);

      if (peerRef.current) peerRef.current.close();
      peerRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;

      console.log("👋 Viewer cleanup done");
    };
  }, [socket, streamId]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="rounded-lg border w-full max-w-md"
    />
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

export default function StreamViewer({ streamId, socket }) {
  const videoRef = useRef();
  const peerRef = useRef(null);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    if (!socket || !streamId) return;

    // Cleanup old peer
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;

    // Cleanup old listeners
    socket.off("offer");
    socket.off("ice-candidate");
    socket.off("viewer-count");

    // Viewer count updates
    socket.on("viewer-count", ({ count }) => {
      setViewerCount(count);
    });

    // Create WebRTC peer
    const createPeer = () => {
      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      peer.ontrack = (e) => {
        if (videoRef.current) videoRef.current.srcObject = e.streams[0];
      };

      peer.onicecandidate = (e) => {
        if (e.candidate && peer.sellerId) {
          socket.emit("ice-candidate", {
            target: peer.sellerId,
            candidate: e.candidate,
          });
        }
      };

      return peer;
    };

    const handleOffer = async ({ sellerId, sdp }) => {
      if (peerRef.current) peerRef.current.close();

      const peer = createPeer();
      peer.sellerId = sellerId;
      peerRef.current = peer;

      await peer.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.emit("answer", { sellerId, sdp: answer });
    };

    socket.once("offer", handleOffer);

    socket.on("ice-candidate", ({ candidate }) => {
      if (candidate && peerRef.current) {
        peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      if (peerRef.current) peerRef.current.close();
      peerRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;

      socket.off("viewer-count");
      socket.off("offer");
      socket.off("ice-candidate");
    };
  }, [socket, streamId]);

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-sm text-gray-600">👀 {viewerCount} watching</p>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="rounded-lg border w-full max-w-md"
      />
    </div>
  );
}

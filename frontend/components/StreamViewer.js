"use client";
import { useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_BASE_URL, { transports: ["websocket"] });

export default function StreamViewer({ streamId }) {
  const videoRef = useRef();
  const peerRef = useRef(null);

  useEffect(() => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerRef.current = peer;

    // Display seller stream
    peer.ontrack = (e) => {
      videoRef.current.srcObject = e.streams[0];
    };

    // Send ICE candidates to seller
    peer.onicecandidate = (e) => {
      if (e.candidate && peer.sellerId) {
        socket.emit("ice-candidate", { target: peer.sellerId, candidate: e.candidate });
      }
    };

    // Join the stream
    socket.emit("join-stream", { streamId });
    console.log("👋 Viewer joined stream:", streamId);

    // Receive offer from seller
    socket.on("offer", async ({ sellerId, sdp }) => {
      console.log("📡 Received offer from seller:", sellerId);
      peer.sellerId = sellerId;

      try {
        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("answer", { sellerId, sdp: answer });
        console.log("✅ Answer sent to seller");
      } catch (err) {
        console.error("❌ Error handling offer:", err);
      }
    });

    // Receive ICE candidate from seller
    socket.on("ice-candidate", async ({ candidate }) => {
      if (candidate) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("⚠️ Error adding ICE candidate:", err);
        }
      }
    });

    // Seller ends stream
    socket.on("stream-ended", () => {
      alert("Stream ended by seller");
      peer.close();
      console.log("🛑 Stream ended by seller");
    });

    return () => {
      socket.emit("leave-stream", { streamId });
      socket.off("offer");
      socket.off("ice-candidate");
      socket.off("stream-ended");
      peer.close();
      console.log("👋 Viewer cleanup complete");
    };
  }, [streamId]);

  return (
    <div className="flex flex-col items-center">
      <video ref={videoRef} autoPlay playsInline className="rounded-lg border w-full max-w-md" />
    </div>
  );
}

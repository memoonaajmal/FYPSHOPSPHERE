"use client";
import { useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io(process.env.NEXT_PUBLIC_BASE_URL, { transports: ["websocket"] });

export default function StreamPublisher({ streamId, isStreamActive = true }) { // 🟢 added prop
  const videoRef = useRef();
  const peers = useRef({});
  const streamRef = useRef(null);

  useEffect(() => {
    async function startStream() {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = localStream;
      videoRef.current.srcObject = localStream;

      socket.emit("start-stream", { streamId });

      socket.off("viewer-joined");
      socket.off("answer");
      socket.off("ice-candidate");

      socket.on("viewer-joined", async ({ viewerId }) => {
        console.log("📡 Viewer joined:", viewerId);

        if (peers.current[viewerId]) {
          peers.current[viewerId].close();
          delete peers.current[viewerId];
        }

        const peer = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        peers.current[viewerId] = peer;

        localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

        peer.onicecandidate = e => {
          if (e.candidate) socket.emit("ice-candidate", { target: viewerId, candidate: e.candidate });
        };

        try {
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          socket.emit("offer", { viewerId, sdp: peer.localDescription });
        } catch (err) {
          console.error("Error creating/sending offer:", err);
        }
      });

      socket.on("answer", async ({ viewerId, sdp }) => {
        const peer = peers.current[viewerId];
        if (!peer) return console.warn("No peer found for", viewerId);
        if (peer.signalingState !== "have-local-offer") return;
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(sdp));
        } catch (err) {
          console.error("❌ Failed to set remote answer:", err);
        }
      });

      socket.on("ice-candidate", async ({ from, candidate }) => {
        const peer = peers.current[from];
        if (peer && candidate) await peer.addIceCandidate(new RTCIceCandidate(candidate));
      });
    }

    startStream();

    return () => {
      cleanupStream(); // 🟢 use helper cleanup
    };
  }, [streamId]);

  // 🟢 cleanup function (used in both unmount + external end)
  function cleanupStream() {
    socket.emit("stream-ended", { streamId });
    Object.values(peers.current).forEach(p => p.close());
    peers.current = {};
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    socket.off();
  }

  // 🟢 Stop camera/mic immediately if parent ends stream
  useEffect(() => {
    if (!isStreamActive) {
      console.log("🛑 StreamPublisher: stopping media & cleaning up...");
      cleanupStream();
    }
  }, [isStreamActive]);

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-2">🎥 You are Live!</h2>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="rounded-lg border w-full max-w-md"
      />
    </div>
  );
}

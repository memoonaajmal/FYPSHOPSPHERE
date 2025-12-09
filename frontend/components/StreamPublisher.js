"use client";
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

const StreamPublisher = forwardRef(({ streamId, isStreamActive = true, socket }, ref) => {
  const videoRef = useRef();
  const peers = useRef({});
  const streamRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    async function startStream() {
      const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = localStream;
      videoRef.current.srcObject = localStream;

      socket.emit("start-stream", { streamId });

      // Cleanup old listeners before adding new ones
      socket.off("viewer-joined");
      socket.off("answer");
      socket.off("ice-candidate");

      socket.on("viewer-joined", async ({ viewerId }) => {
        console.log("Viewer joined:", viewerId);

        if (peers.current[viewerId]) {
          peers.current[viewerId].close();
          delete peers.current[viewerId];
        }

        const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        peers.current[viewerId] = peer;

        localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

        peer.onicecandidate = (e) => {
          if (e.candidate)
            socket.emit("ice-candidate", { target: viewerId, candidate: e.candidate });
        };

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("offer", { viewerId, sdp: peer.localDescription });
      });

      socket.on("answer", async ({ viewerId, sdp }) => {
        const peer = peers.current[viewerId];
        if (!peer) return;
        await peer.setRemoteDescription(new RTCSessionDescription(sdp));
      });

      socket.on("ice-candidate", async ({ from, candidate }) => {
        const peer = peers.current[from];
        if (peer && candidate) await peer.addIceCandidate(new RTCIceCandidate(candidate));
      });
    }

    startStream();

    return () => cleanupStream();
  }, [streamId, socket]);

  function cleanupStream() {
    console.log("Cleaning up StreamPublisher...");

    socket?.emit("stream-ended", { streamId });

    Object.values(peers.current).forEach(peer => {
      try { peer.close(); } catch (e) {}
    });
    peers.current = {};

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    const video = videoRef.current;
    if (video) video.srcObject = null;

    streamRef.current = null;

    socket?.off("viewer-joined");
    socket?.off("answer");
    socket?.off("ice-candidate");

    console.log("StreamPublisher cleanup complete");
  }

  useImperativeHandle(ref, () => ({ cleanupStream }));

  useEffect(() => {
    if (!isStreamActive) cleanupStream();
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
});

export default StreamPublisher;

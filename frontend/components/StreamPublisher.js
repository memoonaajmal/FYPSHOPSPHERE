"use client";

import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";

const StreamPublisher = forwardRef(
  ({ streamId, isStreamActive = true, socket }, ref) => {
    const videoRef = useRef();
    const peers = useRef({});
    const streamRef = useRef(null);

    const [viewerCount, setViewerCount] = useState(0);
    const [viewers, setViewers] = useState([]); // ✅ viewer names

    useEffect(() => {
      if (!socket) return;

      async function startStream() {
        const localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        streamRef.current = localStream;
        videoRef.current.srcObject = localStream;

        socket.emit("start-stream", { streamId });

        socket.off("viewer-joined");
        socket.off("viewer-left");
        socket.off("answer");
        socket.off("ice-candidate");
        socket.off("viewer-list");

        socket.on("viewer-joined", async ({ viewerId }) => {
          setViewerCount((prev) => prev + 1);

          const peer = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          });

          peers.current[viewerId] = peer;

          localStream.getTracks().forEach((track) =>
            peer.addTrack(track, localStream)
          );

          peer.onicecandidate = (e) => {
            if (e.candidate) {
              socket.emit("ice-candidate", {
                target: viewerId,
                candidate: e.candidate,
              });
            }
          };

          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);

          socket.emit("offer", {
            viewerId,
            sdp: peer.localDescription,
          });
        });

        socket.on("viewer-left", ({ viewerId }) => {
          setViewerCount((prev) => Math.max(0, prev - 1));

          const peer = peers.current[viewerId];
          if (peer) {
            peer.close();
            delete peers.current[viewerId];
          }
        });

        socket.on("viewer-list", ({ viewers }) => {
          setViewers(viewers);
        });

        socket.on("answer", async ({ viewerId, sdp }) => {
          const peer = peers.current[viewerId];
          if (!peer) return;
          await peer.setRemoteDescription(
            new RTCSessionDescription(sdp)
          );
        });

        socket.on("ice-candidate", async ({ from, candidate }) => {
          const peer = peers.current[from];
          if (peer && candidate) {
            await peer.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
        });
      }

      startStream();
      return () => cleanupStream();
    }, [streamId, socket]);

    function cleanupStream() {
      Object.values(peers.current).forEach((peer) => peer.close());
      peers.current = {};

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (videoRef.current) videoRef.current.srcObject = null;

      socket?.off("viewer-joined");
      socket?.off("viewer-left");
      socket?.off("viewer-list");
      socket?.off("answer");
      socket?.off("ice-candidate");

      setViewerCount(0);
      setViewers([]);
    }

    useImperativeHandle(ref, () => ({ cleanupStream }));

    useEffect(() => {
      if (!isStreamActive) cleanupStream();
    }, [isStreamActive]);

    return (
      <div className="flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-1">🎥 You are Live!</h2>

        <p className="text-sm text-gray-600 mb-2">
          Viewers: {viewerCount}
        </p>

        {/* ✅ VIEWER NAMES */}
        <div className="w-full max-w-md mb-2">
          <p className="text-sm font-semibold">Joined users:</p>
          {viewers.length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              No viewers yet
            </p>
          ) : (
            <ul className="text-sm">
              {viewers.map((name, i) => (
                <li key={i}>👤 {name}</li>
              ))}
            </ul>
          )}
        </div>

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
);

export default StreamPublisher;

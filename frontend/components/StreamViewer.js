"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./styles/StreamPublisher.module.css";

export default function StreamViewer({ streamId, socket, setViewerCount }) {
  const videoRef = useRef();
  const peerRef = useRef(null);

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

    // Viewer count updates — use parent setter
    socket.on("viewer-count", ({ count }) => {
      setViewerCount(count); // <-- update parent state
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
    <video
  ref={videoRef}
  autoPlay
  playsInline
  className={styles.videoFeed}
/>
  );
}

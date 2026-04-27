"use client";

import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import styles from "./styles/StreamPublisher.module.css";


const StreamPublisher = forwardRef(
  ({ streamId, isStreamActive = true, socket, streamTitle, storeName, children }, ref) => {
    const videoRef = useRef();
    const peers = useRef({});
    const streamRef = useRef(null);

    const [viewerCount, setViewerCount] = useState(0);
    const [viewers, setViewers] = useState([]); // ✅ viewer names
    const [showViewerList, setShowViewerList] = useState(false);

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
      <div className={styles.videoPanel}>
  {/* Video wrap with overlays */}
  <div className={styles.videoWrap}>
    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className={styles.videoFeed}
    />

    {/* Top overlay: live chip ONLY */}
    <div className={styles.vidOverlayTop}>
      <div className={styles.liveChip}>
        <span className={styles.reddot} />
        Live
      </div>
    </div>

    {/* Bottom overlay: stream identity + end stream */}
    <div className={styles.vidOverlayBottom}>
      <div className={styles.sellerChip}>
        <div className={styles.sellerAvatar}>
          {storeName?.charAt(0).toUpperCase()}
          <span className={styles.avatarRing} />
        </div>
        <div>
          <div className={styles.sellerName}>{storeName}</div>
          <div className={styles.sellerSub}>ShopSphere Seller</div>
        </div>
      </div>
      {children}
    </div>
  </div>

  {/* Info bar below video */}
  <div className={styles.infoBar}>
    <div>
      <div className={styles.streamTitle}>{streamTitle}</div>
      <div className={styles.streamSub}>Live shopping · viewers can buy instantly</div>
    </div>
    <button
      className={styles.viewerButton}
      onClick={() => setShowViewerList(!showViewerList)}
    >
      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="6" r="2.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4"/>
        <path d="M2 13c0-2.8 2.7-4.5 6-4.5s6 1.7 6 4.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
      {viewerCount} watching
    </button>
  </div>

  {/* Viewer List Popup */}
  {showViewerList && (
    <>
      <div
        className={styles.viewerListBackdrop}
        onClick={() => setShowViewerList(false)}
      />
      <div className={styles.viewerListPopup}>
        <div className={styles.viewerListHeader}>
          <h3 className={styles.viewerListTitle}>Viewers</h3>
          <span className={styles.viewerListCount}>{viewerCount}</span>
        </div>
        {viewers.length === 0 ? (
          <p className={styles.viewerEmpty}>No viewers yet</p>
        ) : (
          <ul className={styles.viewerNames}>
            {viewers.map((viewer, index) => (
              <li key={index}>{viewer}</li>
            ))}
          </ul>
        )}
        <button
          className={styles.closePopupButton}
          onClick={() => setShowViewerList(false)}
        >
          Close
        </button>
      </div>
    </>
  )}
</div>
    );
  }
);

export default StreamPublisher;
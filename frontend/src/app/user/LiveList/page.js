"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../../../styles/LiveList.module.css";

export default function LiveListPage() {
  const [streams, setStreams] = useState([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/streams`)
      .then(res => res.json())
      .then(setStreams)
      .catch(console.error);
  }, []);

  return (
    <div className={styles.liveStreamPage}>
  <div className={styles.liveNowContainer}>
<div className={styles.heroSection}>
  <div className={styles.heroEyebrow}>
    <span className={styles.liveDot} />
    {streams.length} stream{streams.length !== 1 ? "s" : ""} live
  </div>
  <h1 className={styles.heroTitle}>
    Tune in.<br />Shop <span className={styles.heroAccent}>live.</span>
  </h1>
  <p className={styles.heroSub}>
    Watch sellers showcase their products in real time — ask questions, grab deals, and buy before they're gone.
  </p>
</div>

<div className={styles.listDivider}>
  <span className={styles.dividerLine} />
  <span className={styles.dividerLabel}>Live now</span>
  <span className={styles.dividerLine} />
</div>

    <h1 className={styles.liveNowHeading}>Live Now</h1>

    {streams.length === 0 && (
      <p className={styles.noStreamsText}>No live streams right now.</p>
    )}

    <div className={styles.streamsGrid}>
      {streams.map((stream) => {
        const initials = stream.sellerName
          ? stream.sellerName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
          : "??";

        const ringColors = [
          { bg: "#1e3a5f", ring: "#4a90d9" },
          { bg: "#2a1f4a", ring: "#9b72e0" },
          { bg: "#1f3d2a", ring: "#4ec47a" },
          { bg: "#3d1f1f", ring: "#e07050" },
          { bg: "#1f3535", ring: "#40c4b0" },
          { bg: "#3a2a10", ring: "#d4a040" },
        ];
        const color = ringColors[stream._id.charCodeAt(stream._id.length - 1) % ringColors.length];

        return (
          <Link
            href={`/user/LiveStream/${stream.slug}`}
            key={stream._id}
            className={styles.streamCard}
          >
            {/* Avatar */}
            <div
              className={styles.streamAvatar}
              style={{ background: color.bg }}
            >
              <div
                className={styles.streamAvatarRing}
                style={{ borderColor: color.ring }}
              />
              {initials}
            </div>

            {/* Info */}
            <div className={styles.streamInfo}>
              <h2 className={styles.streamTitle}>{stream.title}</h2>
              <p className={styles.sellerName}>{stream.sellerName}</p>
            </div>

            {/* Meta */}
            <div className={styles.streamMeta}>
              <div className={styles.liveBadge}>
                <div className={styles.liveDot} />
                Live
              </div>
              {stream.viewerCount != null && (
                <span className={styles.viewerCount}>
                  {stream.viewerCount.toLocaleString()} watching
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  </div>
</div>
  );
}

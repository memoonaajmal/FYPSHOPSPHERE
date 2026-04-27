"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./styles/StreamChat.module.css";

export default function StreamChat({ streamId, username, userType, socket }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [pinnedMessage, setPinnedMessage] = useState(null);

  const seen = useRef(new Set());

  function msgKey(msg) {
    if (!msg) return "";
    if (msg._id) return `_id:${msg._id}`;
    return `f:${msg.user}::${msg.text}::${msg.createdAt || ""}`;
  }

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      // ✅ SELLER MESSAGE: ALWAYS PIN & REPLACE
      if (msg.userType === "seller") {
        setPinnedMessage(msg);
        return; // ❗ never add to chat list
      }

      // ⛔ Dedup ONLY for viewer messages
      const key = msgKey(msg);
      if (seen.current.has(key)) return;
      seen.current.add(key);

      setMessages((prev) => [...prev, msg]);
    };

    socket.on("chat-message", handleMessage);
    return () => socket.off("chat-message", handleMessage);
  }, [socket]);

  const sendMessage = () => {
    if (!text.trim() || !socket) return;

    socket.emit("chat-message", {
      user: username,
      text,
      streamId,
      userType,
      createdAt: new Date().toISOString(),
    });

    setText("");
  };

  return (
    <div className={styles.streamChat}>
  <div className={styles.chatHeader}>
    <h3 className={styles.chatTitle}>Live Chat</h3>
<span className={styles.chatLivePill}>
  <span className={styles.chatLiveDot} />
  Live
</span>  </div>

  {pinnedMessage && (
    <div className={styles.pinnedMessage}>
      <strong>{pinnedMessage.user}</strong>: {pinnedMessage.text}
    </div>
  )}

  <div className={styles.messageList}>
    {messages.length === 0 && (
      <p className={styles.emptyState}>No messages yet...</p>
    )}
    {messages.map((m, i) => (
      <div key={msgKey(m) + i} className={styles.messageRow}>
        <strong>{m.user}</strong>
        <span>{m.text}</span>
      </div>
    ))}
  </div>

  <div className={styles.inputRow}>
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      className={styles.chatInput}
      placeholder={userType === "seller" ? "Type a message to pin..." : "Type a message..."}
    />
    <button
      onClick={sendMessage}
      className={`${styles.sendBtn} ${userType === "seller" ? styles.seller : ""}`}
    >
      Send
    </button>
  </div>
</div>
  );
}

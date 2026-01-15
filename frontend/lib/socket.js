import { io } from "socket.io-client";

const socketMap = new Map();

export const getSocket = (role, streamId, userId) => {
  if (!streamId) return null;

  const key = `${role}-${streamId}-${userId}`;

  // 🔥 IMPORTANT: do not reuse disconnected sockets
  const existing = socketMap.get(key);
  if (existing && existing.connected) return existing;

  if (existing && !existing.connected) {
    socketMap.delete(key);
  }

  const socket = io(process.env.NEXT_PUBLIC_BASE_URL, {
    transports: ["websocket"],
    query: { role, streamId, userId },
  });

  socketMap.set(key, socket);

  socket.on("connect", () => {
    console.log(`[${role}] connected for stream ${streamId}: ${socket.id}`);
  });

  socket.on("disconnect", () => {
    console.log(`[${role}] disconnected for stream ${streamId}`);
    socketMap.delete(key); // 🔥 CRITICAL
  });

  if (typeof window !== "undefined" && !window.__socketUnloadAdded) {
    window.addEventListener("beforeunload", () => {
      socketMap.forEach((s) => s.disconnect());
      socketMap.clear();
    });
    window.__socketUnloadAdded = true;
  }

  return socket;
};

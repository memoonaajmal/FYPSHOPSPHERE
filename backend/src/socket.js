const LiveStream = require("./models/LiveStream");
const Message = require("./models/Message");

module.exports = function setupSocket(io) {
  const rooms = {}; // { streamId: { sellerSocketId, viewers: Set() } }

  io.on("connection", (socket) => {
    console.log("⚡ Socket connected:", socket.id);

    // ✅ Seller starts stream
    socket.on("start-stream", ({ streamId }) => {
      rooms[streamId] = { sellerSocketId: socket.id, viewers: new Set() };
      socket.join(streamId);
      io.to(streamId).emit("live-started", { streamId });
      console.log(`🎥 Seller started stream ${streamId}`);
    });

    // ✅ Seller rejoins after refresh
    socket.on("reconnect-seller", ({ streamId }) => {
      if (!rooms[streamId]) {
        rooms[streamId] = { sellerSocketId: socket.id, viewers: new Set() };
      } else {
        rooms[streamId].sellerSocketId = socket.id;
        delete rooms[streamId].sellerDisconnectedAt; // ✅ clear disconnect flag
      }
      socket.join(streamId);
      console.log(`♻️ Seller reconnected to stream ${streamId}`);
    });

    // ✅ Viewer joins
    socket.on("join-stream", ({ streamId }) => {
      const room = rooms[streamId];
      if (!room) {
        console.warn(`❌ Stream ${streamId} not found`);
        return;
      }

      room.viewers.add(socket.id);
      socket.join(streamId);

      io.to(room.sellerSocketId).emit("viewer-joined", { viewerId: socket.id });
      console.log(`👀 Viewer ${socket.id} joined stream ${streamId}`);
    });

    // ✅ Viewer leaves
    socket.on("leave-stream", ({ streamId }) => {
      const room = rooms[streamId];
      if (room && room.viewers.has(socket.id)) {
        room.viewers.delete(socket.id);
        io.to(room.sellerSocketId).emit("viewer-left", { viewerId: socket.id });
        console.log(`👋 Viewer ${socket.id} left stream ${streamId}`);
      }
      socket.leave(streamId);
    });

    // ✅ WebRTC signaling
    socket.on("offer", ({ viewerId, sdp }) => {
      io.to(viewerId).emit("offer", { sellerId: socket.id, sdp });
    });

    socket.on("answer", ({ sellerId, sdp }) => {
      io.to(sellerId).emit("answer", { viewerId: socket.id, sdp });
    });

    socket.on("ice-candidate", ({ target, candidate }) => {
      io.to(target).emit("ice-candidate", { from: socket.id, candidate });
    });

    // ✅ Chat messages
    socket.on("chat-message", async ({ streamId, user, text }) => {
      try {
        const message = await Message.create({ stream: streamId, user, text });
        // Broadcast to all in the same room
        io.to(streamId).emit("chat-message", message);
      } catch (err) {
        console.error("Failed to save message:", err);
      }
    });

    // ✅ Disconnect handler with reconnect grace period
socket.on("disconnect", () => {
  for (const [streamId, room] of Object.entries(rooms)) {
    // If seller disconnected
    if (room.sellerSocketId === socket.id) {
      console.log(`⚠️ Seller disconnected from ${streamId}, waiting for reconnect...`);

      // Mark seller temporarily offline, but keep room alive
      room.sellerDisconnectedAt = Date.now();

      // Give seller 10 seconds to reconnect before ending stream
      setTimeout(() => {
        const stillOffline =
          rooms[streamId] &&
          rooms[streamId].sellerDisconnectedAt &&
          Date.now() - rooms[streamId].sellerDisconnectedAt > 10000;

        if (stillOffline) {
          io.to(streamId).emit("stream-ended");
          delete rooms[streamId];
          console.log(`💀 Seller did not reconnect — stream ${streamId} ended`);
        } else {
          console.log(`✅ Seller reconnected — stream ${streamId} continues`);
        }
      }, 10000);
    }

    // If viewer disconnected
    else if (room.viewers.has(socket.id)) {
      room.viewers.delete(socket.id);
      io.to(room.sellerSocketId).emit("viewer-left", { viewerId: socket.id });
      console.log(`🚪 Viewer ${socket.id} disconnected from ${streamId}`);
    }
  }
});

  });
};

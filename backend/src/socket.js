const LiveStream = require("./models/LiveStream");
const Message = require("./models/Message");

const rooms = {}; // { streamId: { sellerSocketId, viewers: Set(), sellerDisconnectedAt } }

function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("⚡ Socket connected:", socket.id);
    console.log("🔍 Connected socket role check:", socket.handshake.query);

    // ✅ Seller starts stream
    socket.on("start-stream", ({ streamId }) => {
      rooms[streamId] = { sellerSocketId: socket.id, viewers: new Set() };
      socket.join(streamId);
      io.to(streamId).emit("live-started", { streamId });
      console.log(`🎥 Seller started stream ${streamId}`);
    });

    // ✅ Seller reconnects
    socket.on("reconnect-seller", ({ streamId }) => {
      if (!rooms[streamId]) {
        rooms[streamId] = { sellerSocketId: socket.id, viewers: new Set() };
      } else {
        rooms[streamId].sellerSocketId = socket.id;
        delete rooms[streamId].sellerDisconnectedAt;
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
      if (room.sellerSocketId) io.to(room.sellerSocketId).emit("viewer-joined", { viewerId: socket.id });
      console.log(`👀 Viewer ${socket.id} joined stream ${streamId}`);
    });

    // ✅ Viewer leaves
    socket.on("leave-stream", ({ streamId }) => {
      const room = rooms[streamId];
      if (room && room.viewers.has(socket.id)) {
        room.viewers.delete(socket.id);
        if (room.sellerSocketId) io.to(room.sellerSocketId).emit("viewer-left", { viewerId: socket.id });
        console.log(`👋 Viewer ${socket.id} left stream ${streamId}`);
      }
      socket.leave(streamId);
    });

    // ✅ WebRTC signaling
    socket.on("offer", ({ viewerId, sdp }) => io.to(viewerId).emit("offer", { sellerId: socket.id, sdp }));
    socket.on("answer", ({ sellerId, sdp }) => io.to(sellerId).emit("answer", { viewerId: socket.id, sdp }));
    socket.on("ice-candidate", ({ target, candidate }) => io.to(target).emit("ice-candidate", { from: socket.id, candidate }));

    // ✅ Chat messages
    socket.on("chat-message", async ({ streamId, user, text }) => {
      try {
        const message = await Message.create({ stream: streamId, user, text });
        io.to(streamId).emit("chat-message", message);
      } catch (err) {
        console.error("Failed to save message:", err);
      }
    });

    // ✅ Disconnect handler
    socket.on("disconnect", () => {
      for (const [streamId, room] of Object.entries(rooms)) {
        if (!room) continue;

        // Seller disconnected
        if (room.sellerSocketId === socket.id) {
          console.log(`⚠️ Seller disconnected from ${streamId}, waiting for reconnect...`);
          room.sellerDisconnectedAt = Date.now();

          setTimeout(() => {
            try {
              const stillOffline =
                rooms[streamId] &&
                rooms[streamId].sellerDisconnectedAt &&
                Date.now() - rooms[streamId].sellerDisconnectedAt > 10000;

              if (stillOffline) {
                io.to(streamId).emit("stream-ended");

                // Clean up all sockets in room
                rooms[streamId].viewers.forEach((viewerId) => {
                  const viewerSocket = io.sockets.sockets.get(viewerId);
                  if (viewerSocket) viewerSocket.leave(streamId);
                });
                const sellerSocket = io.sockets.sockets.get(rooms[streamId].sellerSocketId);
                if (sellerSocket) sellerSocket.leave(streamId);

                delete rooms[streamId];
                console.log(`💀 Seller did not reconnect — stream ${streamId} ended and sockets cleaned`);
              }
            } catch (err) {
              console.error("🔥 Error in disconnect timeout:", err);
            }
          }, 10000);
        }

        // Viewer disconnected
        else if (room.viewers.has(socket.id)) {
          room.viewers.delete(socket.id);
          if (room.sellerSocketId) io.to(room.sellerSocketId).emit("viewer-left", { viewerId: socket.id });
          console.log(`🚪 Viewer ${socket.id} disconnected from ${streamId}`);
        }
      }
    });

    // ✅ Seller ends stream manually
    socket.on("end-stream", ({ streamId }) => {
      const room = rooms[streamId];
      if (!room) return;

      io.to(streamId).emit("stream-ended");

      // Clean up sockets
      room.viewers.forEach((viewerId) => {
        const viewerSocket = io.sockets.sockets.get(viewerId);
        if (viewerSocket) viewerSocket.leave(streamId);
      });
      const sellerSocket = io.sockets.sockets.get(room.sellerSocketId);
      if (sellerSocket) sellerSocket.leave(streamId);

      delete rooms[streamId];
      console.log(`🛑 Stream ${streamId} ended by seller & cleaned up sockets`);
    });
  });
}

module.exports = { setupSocket, rooms };

const LiveStream = require("./models/LiveStream");
const Message = require("./models/Message");

// rooms structure
// {
//   streamId: {
//     sellerSocketId,
//     viewers: Map(socketId => { name }),
//     sellerDisconnectedAt
//   }
// }
const rooms = {};

// helper: send viewer names to seller only
function emitViewerList(io, streamId) {
  const room = rooms[streamId];
  if (!room || !room.sellerSocketId) return;

  const viewers = Array.from(room.viewers.values()).map(
    (v) => v.name
  );

  io.to(room.sellerSocketId).emit("viewer-list", { viewers });
}

function setupSocket(io) {
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // ===============================
    // SELLER START STREAM
    // ===============================
    socket.on("start-stream", ({ streamId }) => {
      rooms[streamId] = {
        sellerSocketId: socket.id,
        viewers: new Map(),
      };

      socket.join(streamId);

      io.to(streamId).emit("viewer-count", { count: 0 });
      io.to(streamId).emit("live-started", { streamId });
    });

    // ===============================
    // VIEWER JOINS
    // ===============================
    socket.on("join-stream", ({ streamId, viewerName }) => {
      const room = rooms[streamId];
      if (!room) return;

      if (room.viewers.has(socket.id)) return;

      room.viewers.set(socket.id, {
        name: viewerName || "Anonymous",
      });

      socket.join(streamId);

      // WebRTC
      if (room.sellerSocketId) {
        io.to(room.sellerSocketId).emit("viewer-joined", {
          viewerId: socket.id,
        });
      }

      // viewer count
      io.to(streamId).emit("viewer-count", {
        count: room.viewers.size,
      });

      // ✅ SEND VIEWER NAMES TO SELLER
      emitViewerList(io, streamId);
    });

    // ===============================
    // VIEWER LEAVES
    // ===============================
    socket.on("leave-stream", ({ streamId }) => {
      const room = rooms[streamId];
      if (!room) return;

      if (room.viewers.has(socket.id)) {
        room.viewers.delete(socket.id);
        socket.leave(streamId);

        if (room.sellerSocketId) {
          io.to(room.sellerSocketId).emit("viewer-left", {
            viewerId: socket.id,
          });
        }

        io.to(streamId).emit("viewer-count", {
          count: room.viewers.size,
        });

        emitViewerList(io, streamId);
      }
    });

    // ===============================
    // WEBRTC SIGNALING
    // ===============================
    socket.on("offer", ({ viewerId, sdp }) => {
      io.to(viewerId).emit("offer", {
        sellerId: socket.id,
        sdp,
      });
    });

    socket.on("answer", ({ sellerId, sdp }) => {
      io.to(sellerId).emit("answer", {
        viewerId: socket.id,
        sdp,
      });
    });

    socket.on("ice-candidate", ({ target, candidate }) => {
      io.to(target).emit("ice-candidate", {
        from: socket.id,
        candidate,
      });
    });

    // ===============================
    // CHAT
    // ===============================
    socket.on("chat-message", async ({ streamId, user, text, userType }) => {
      try {
        const message = await Message.create({
          stream: streamId,
          user,
          text,
          userType,
        });

        io.to(streamId).emit("chat-message", {
          _id: message._id,
          user,
          text,
          userType,
          streamId,
          createdAt: message.createdAt,
        });
      } catch (err) {
        console.error(err);
      }
    });

    // ===============================
    // DISCONNECT
    // ===============================
    socket.on("disconnect", () => {
      for (const [streamId, room] of Object.entries(rooms)) {
        if (!room) continue;

        // seller disconnect
        if (room.sellerSocketId === socket.id) {
          room.sellerDisconnectedAt = Date.now();

          setTimeout(() => {
            if (
              rooms[streamId] &&
              rooms[streamId].sellerDisconnectedAt &&
              Date.now() - rooms[streamId].sellerDisconnectedAt > 10000
            ) {
              io.to(streamId).emit("stream-ended");
              delete rooms[streamId];
            }
          }, 10000);
        }

        // viewer disconnect
        else if (room.viewers.has(socket.id)) {
          room.viewers.delete(socket.id);

          if (room.sellerSocketId) {
            io.to(room.sellerSocketId).emit("viewer-left", {
              viewerId: socket.id,
            });
          }

          io.to(streamId).emit("viewer-count", {
            count: room.viewers.size,
          });

          emitViewerList(io, streamId);
        }
      }
    });

    // ===============================
    // SELLER ENDS STREAM
    // ===============================
    socket.on("end-stream", ({ streamId }) => {
      const room = rooms[streamId];
      if (!room) return;

      io.to(streamId).emit("stream-ended");
      delete rooms[streamId];
    });
  });
}

module.exports = { setupSocket, rooms };

const LiveStream = require("../models/LiveStream");
const User = require("../models/User"); // import user model
const { nanoid } = require("nanoid");
const { rooms } = require("../socket"); // ✅ Import rooms for cleanup

exports.createStream = async (req, res) => {
  const { title, sellerId } = req.body;
  const slug = `${sellerId}-${nanoid(6)}`;
  const stream = await LiveStream.create({ title, seller: sellerId, slug });
  res.json(stream);
};

exports.getAllStreams = async (req, res) => {
  const streams = await LiveStream.find({ status: "live" });

  // Attach seller info
  const streamsWithSeller = await Promise.all(
    streams.map(async (s) => {
      const seller = await User.findOne({ firebaseUid: s.seller }).select("name email");
      return {
        ...s.toObject(),
        sellerName: seller?.name || "Unknown",
        sellerEmail: seller?.email || "No email",
      };
    })
  );

  res.json(streamsWithSeller);
};

exports.getStreamBySlug = async (req, res) => {
  const stream = await LiveStream.findOne({ slug: req.params.slug });
  if (!stream) return res.status(404).json({ error: "Not found" });

  const seller = await User.findOne({ firebaseUid: stream.seller }).select("name email");

  res.json({
    ...stream.toObject(),
    sellerName: seller?.name || "Unknown",
    sellerEmail: seller?.email || "No email",
  });
};


exports.endStream = async (req, res) => {
  try {
    const streamId = req.params.id;
    console.log("🧩 req.io available:", !!req.io);

    // Update DB
    await LiveStream.findByIdAndUpdate(streamId, { status: "ended" });

    const room = rooms[streamId];
    if (room && req.io) {
      // Notify everyone
      req.io.to(streamId).emit("stream-ended");

      // Disconnect all viewers
      room.viewers.forEach((viewerSocketId) => {
        const viewerSocket = req.io.sockets.sockets.get(viewerSocketId);
        if (viewerSocket) viewerSocket.leave(streamId);
      });

      // Disconnect seller
      const sellerSocket = req.io.sockets.sockets.get(room.sellerSocketId);
      if (sellerSocket) sellerSocket.leave(streamId);

      // Remove room from memory
      delete rooms[streamId];
      console.log(`🛑 Stream ${streamId} ended & sockets cleaned`);
    } else {
      console.warn(`⚠️ No room found or req.io missing for stream ${streamId}`);
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to end stream:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

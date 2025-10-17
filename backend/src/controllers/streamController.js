const LiveStream = require("../models/LiveStream");
const { nanoid } = require("nanoid");
const { rooms } = require("../socket"); // ✅ Import rooms for cleanup

exports.createStream = async (req, res) => {
  const { title, sellerId } = req.body;
  const slug = `${sellerId}-${nanoid(6)}`;
  const stream = await LiveStream.create({ title, seller: sellerId, slug });
  res.json(stream);
};

exports.getAllStreams = async (req, res) => {
  const streams = await LiveStream.find({ status: "live" }).populate("seller", "name");
  res.json(streams);
};

exports.getStreamBySlug = async (req, res) => {
  const stream = await LiveStream.findOne({ slug: req.params.slug }).populate("seller", "name");
  if (!stream) return res.status(404).json({ error: "Not found" });
  res.json(stream);
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

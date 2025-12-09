const mongoose = require("mongoose");

const LiveStreamSchema = new mongoose.Schema({
  title: { type: String, required: true },
seller: { type: String, required: true }, // Firebase UID stored as string
  slug: { type: String, unique: true },
  status: { type: String, enum: ["live", "ended"], default: "live" },
  startedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("LiveStream", LiveStreamSchema);

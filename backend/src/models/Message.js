const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  stream: { type: mongoose.Schema.Types.ObjectId, ref: "LiveStream" },
  user: String,
  text: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", MessageSchema);

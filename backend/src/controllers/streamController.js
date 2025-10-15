const LiveStream = require("../models/LiveStream");
const { nanoid } = require("nanoid");

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
  await LiveStream.findByIdAndUpdate(req.params.id, { status: "ended" });
  res.json({ success: true });
};

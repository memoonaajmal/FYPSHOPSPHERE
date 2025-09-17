// models/Price.js
const mongoose = require("mongoose");

const PriceSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true, index: true },
    price: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Price", PriceSchema);

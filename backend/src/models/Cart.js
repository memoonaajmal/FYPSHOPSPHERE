// src/models/Cart.js
const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  storeId:   { type: String },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  image:     { type: String },
  qty:       { type: Number, required: true, default: 1 },
});

const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    items:  [cartItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Cart || mongoose.model("Cart", cartSchema);

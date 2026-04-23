// src/models/Wishlist.js
const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  storeId:   { type: String },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  image:     { type: String },
});

const wishlistSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    items:  [wishlistItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);
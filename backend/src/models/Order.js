// backend/src/models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: false }, // optional if you store product ref
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: String, required: true }, // storing Firebase uid as string
    firstName: String,
    lastName: String,
    phone: String,
    email: String,
    houseAddress: String,
    items: [orderItemSchema],
    itemsTotal: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: { type: String, default: "COD" },
    paymentStatus: { type: String, default: "pending" },
    trackingId: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

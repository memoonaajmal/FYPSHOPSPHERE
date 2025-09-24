const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  // ✅ productId is now a simple String — no casting issues
  productId: { type: String, required: true }, 
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String }, // optional but useful if you want to show order items with images
});

const orderSchema = new mongoose.Schema(
  {
    // ✅ Keep user as MongoDB ObjectId reference (this is correct)
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

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

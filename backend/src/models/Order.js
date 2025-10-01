const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String },
storeId: { type: String, ref: "Store", required: true }, // ✅ now stores string IDs like "store_watch"
  itemPaymentStatus: { type: String, default: "pending" } // 🆕 individual status
});

const orderSchema = new mongoose.Schema(
  {
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
    paymentStatus: { type: String, default: "pending" }, // ✅ overall payment
    trackingId: { type: String, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

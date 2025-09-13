// models/Order.js (CommonJS)
const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: String,
  price: Number,
  quantity: Number,
  image: String,
});

const OrderSchema = new mongoose.Schema({
  user: { type: String, required: true, index: true }, // store Firebase uid
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  houseAddress: { type: String, required: true },
  items: [OrderItemSchema],
  itemsTotal: { type: Number, required: true },
  shippingFee: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['COD', 'JazzCash'], required: true },
  paymentStatus: { type: String, enum: ['pending','paid','failed'], default: 'pending' },
  orderStatus: { type: String, enum: ['created','processing','shipped','delivered','cancelled'], default: 'created' },
  trackingId: { type: String, required: true, unique: true, index: true },
  jazzcashTransactionId: { type: String }, // optional
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);

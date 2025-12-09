// models/Store.js
const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  _id: { type: String, required: true }, 
  name: { type: String, required: true },
  categories: { type: [String], required: true },
  productIds: { type: [String], default: [] },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true } 
});

module.exports = mongoose.model('Store', storeSchema);

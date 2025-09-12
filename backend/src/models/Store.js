// models/Store.js
const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "store_watch"
  name: { type: String, required: true }, // e.g. "Watch Store"
  categories: { type: [String], required: true }, // e.g. ["Watches"]
  productIds: { type: [String], default: [] } // <-- productId is a String in Product schema
});


module.exports = mongoose.model('Store', storeSchema);

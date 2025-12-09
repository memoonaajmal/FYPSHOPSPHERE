// models/StoreRequest.js
const mongoose = require('mongoose');

const storeRequestSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  storeName: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ["Electronics", "Clothing", "Grocery", "Other"], required: true },

  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },

  businessName: { type: String, required: true },
  ownerFullName: { type: String, required: true },

  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },

  cnicNumber: { type: String,required: true },
  cnicImageUrl: { type: String,  required: true},

  logoUrl: { type: String },

  bannerUrl: { type: String },

  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });


module.exports = mongoose.models.StoreRequest || mongoose.model("StoreRequest", storeRequestSchema);

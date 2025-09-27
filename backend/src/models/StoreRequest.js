// models/StoreRequest.js
const mongoose = require('mongoose');

const storeRequestSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Basic Store Info
  storeName: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ["Electronics", "Clothing", "Grocery", "Other"], required: true },

  // Contact Info
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },

  // Business Info
  businessName: { type: String, required: true },
  ownerFullName: { type: String, required: true },

  // Address
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },

  // Verification / Identification
  cnicNumber: { type: String },
  cnicImageUrl: { type: String },

  // Branding (optional)
  logoUrl: { type: String },
  bannerUrl: { type: String },

  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });


module.exports = mongoose.models.StoreRequest || mongoose.model("StoreRequest", storeRequestSchema);

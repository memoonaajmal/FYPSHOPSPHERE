const Store = require("../models/Store");
const Product = require("../models/Product");
const StoreRequest = require("../models/StoreRequest");
const admin = require("firebase-admin"); // make sure Firebase Admin is initialized
const mongoose = require("mongoose");

// ✅ Get all stores
exports.getStores = async (req, res) => {
  try {
    console.log("👉 Hitting GET /api/stores");

    const stores = await Store.find({});
    console.log("✅ Stores found:", stores);

    res.json(stores);
  } catch (err) {
    console.error("❌ Error in GET /api/stores:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get single store with products
exports.getStoreWithProducts = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const products = await Product.find({
      productId: { $in: store.productIds },
    });

    const productsWithImage = products.map((p) => ({
      ...p.toObject(),
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        p.imageFilename
      }`,
    }));

    res.json({ store, products: productsWithImage });
  } catch (err) {
    console.error("❌ Error in GET /api/stores/:id:", err);
    res.status(500).json({ message: err.message });
  }
};

// Check if logged-in seller has a store
exports.checkSellerStore = async (req, res) => {
  try {
    const store = await Store.findOne({ sellerId: req.user.id });
    res.json({ hasStore: !!store });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Error checking store", error: err.message });
  }
};

// Submit store creation request using MongoDB sellerId
exports.createStoreRequest = async (req, res) => {
  try {
    // 🪵 Enhanced debug logs
    console.log("📩 req.body:", req.body);
    console.log("📎 req.files:", req.files);
    console.log("🔍 sellerId received:", req.body.sellerId);
    console.log("🔍 typeof sellerId:", typeof req.body.sellerId);

    const { sellerId } = req.body;

    // ✅ Better validation
    if (!sellerId) {
      console.error("❌ sellerId is missing from request");
      return res.status(400).json({
        message: "sellerId is required",
        received: req.body,
      });
    }

    // ✅ Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        message: "Invalid sellerId format",
      });
    }

    const objectId = new mongoose.Types.ObjectId(sellerId);

    // ✅ Check if user exists
    const User = require("../models/User"); // Adjust path as needed
    const userExists = await User.findById(objectId);
    if (!userExists) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Check if seller already has a pending/approved request
    const existingRequest = await StoreRequest.findOne({
      sellerId: objectId,
      status: { $in: ["pending", "approved"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "You already have a store request",
        request: existingRequest,
      });
    }

    const request = await StoreRequest.create({
      sellerId: objectId,
      storeName: req.body.storeName,
      description: req.body.description,
      category: req.body.category,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      businessName: req.body.businessName,
      ownerFullName: req.body.ownerFullName,
      streetAddress: req.body.streetAddress,
      city: req.body.city,
      state: req.body.state,
      postalCode: req.body.postalCode,
      cnicNumber: req.body.cnicNumber,
      cnicImageUrl: req.files?.cnicImage?.[0]?.path.replace(/\\/g, "/") || "",
      logoUrl: req.files?.logo?.[0]?.path.replace(/\\/g, "/") || "",
      bannerUrl: req.files?.banner?.[0]?.path.replace(/\\/g, "/") || "",
    });

    console.log("✅ Store request created:", request._id);
    res.json({ message: "Store request submitted successfully!", request });
  } catch (err) {
    console.error("💥 Error in createStoreRequest:", err);
    res.status(500).json({
      message: "Error submitting store request",
      error: err.message,
    });
  }
};

exports.getMyStoreRequest = async (req, res) => {
  try {
    const { sellerId } = req.query;
    if (!sellerId) {
      return res.status(400).json({ message: "sellerId is required" });
    }

    const objectId = new mongoose.Types.ObjectId(sellerId);

    const request = await StoreRequest.findOne({ sellerId: objectId });
    if (!request) {
      return res.status(404).json({ message: "Store Request not found" });
    }

    res.json(request);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching store request", error: err.message });
  }
};

// backend/src/controllers/adminController.js
const admin = require("../utils/firebaseAdmin");
const User = require("../models/User");
const Order = require("../models/Order");
const StoreRequest = require("../models/StoreRequest");
const Store = require("../models/Store");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash");
    res.json(users); // return array directly ✅
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: err.message });
  }
};

// GET single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete from Firebase
    if (user.firebaseUid) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
        console.log(`✅ Firebase user ${user.firebaseUid} deleted`);
      } catch (firebaseErr) {
        console.error("❌ Error deleting user from Firebase:", firebaseErr);
      }
    }

    res.json({
      message: "User deleted successfully from MongoDB and Firebase",
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting user", error: err.message });
  }
};

exports.getOrdersByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Fetch orders by email
    const orders = await Order.find({ email }).sort({ createdAt: -1 });

    // ✅ If no orders found, return empty array with 200 OK
    if (!orders || orders.length === 0) {
      return res.status(200).json([]);
    }

    // ✅ Return found orders
    return res.status(200).json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// GET all store requests
exports.getAllStoreRequests = async (req, res) => {
  try {
    const requests = await StoreRequest.find({ status: "pending" }) // only pending
      .populate("sellerId", "email businessName ownerFullName")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error("Error fetching store requests:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET single store request by ID
exports.getStoreRequestById = async (req, res) => {
  try {
    const request = await StoreRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Store request not found" });
    }

    res.json(request);
  } catch (err) {
    console.error("Error fetching store request:", err);
    res
      .status(500)
      .json({ message: "Error fetching store request", error: err.message });
  }
};

exports.updateStoreRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Populate sellerId including _id
    const request = await StoreRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("sellerId", "_id email businessName ownerFullName");

    if (!request) {
      return res.status(404).json({ message: "Store request not found" });
    }

    // ✅ Create store if approved and store doesn't exist
    if (status === "approved") {
      const existingStore = await Store.findOne({
        sellerId: request.sellerId._id,
      });
      if (!existingStore) {
        const newStore = await Store.create({
          _id: `store_${request.storeName.toLowerCase().replace(/\s+/g, "_")}`,
          sellerId: request.sellerId._id,
          name: request.storeName,
          categories: [request.category],
          productIds: [],
        });

        console.log("Store created:", newStore._id);
      }
    }

    res.json({ message: `Store request ${status}`, request });
  } catch (err) {
    console.error("Error updating store request:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

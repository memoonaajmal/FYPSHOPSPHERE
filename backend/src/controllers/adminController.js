// backend/src/controllers/adminController.js
const admin = require("firebase-admin");
const User = require("../models/User");
const Order = require("../models/Order");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash");
    res.json(users); // return array directly ✅
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
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
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user", error: err.message });
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

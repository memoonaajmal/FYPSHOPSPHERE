const admin = require("../utils/firebaseAdmin");
const User = require("../models/User");
const Order = require("../models/Order");
const Store = require("../models/Store");
const StoreRequest = require("../models/StoreRequest");

// ======================================================
// 🧩 USERS
// ======================================================

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching users",
      error: err.message,
    });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching user",
      error: err.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.firebaseUid) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
        console.log(`✅ Firebase user ${user.firebaseUid} deleted`);
      } catch (firebaseErr) {
        console.error("❌ Firebase delete error:", firebaseErr);
      }
    }

    res.status(200).json({
      message: "User deleted successfully from MongoDB and Firebase",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error deleting user",
      error: err.message,
    });
  }
};

// ======================================================
// 🛒 ORDERS (BY EMAIL)
// ======================================================

exports.getOrdersByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments({ email });
    const orders = await Order.find({ email })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};

// ======================================================
// 🏪 STORE REQUESTS
// ======================================================

exports.getAllStoreRequests = async (req, res) => {
  try {
    const requests = await StoreRequest.find({ status: "pending" })
      .populate("sellerId", "email name")
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (err) {
    console.error("Error fetching store requests:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getStoreRequestById = async (req, res) => {
  try {
    const request = await StoreRequest.findById(req.params.id);
    if (!request)
      return res.status(404).json({ message: "Store request not found" });
    res.status(200).json(request);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching store request",
      error: err.message,
    });
  }
};

exports.updateStoreRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const request = await StoreRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("sellerId", "_id email name");

    if (!request)
      return res.status(404).json({ message: "Store request not found" });

    // ✅ Create store if approved
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
        console.log("✅ New Store Created:", newStore._id);
      }
    }

    res.status(200).json({ message: `Store request ${status}`, request });
  } catch (err) {
    console.error("Error updating store request:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ======================================================
// 📦 STORE ORDERS (ADMIN VIEW)
// ======================================================

exports.getStoreOrdersForAdmin = async (req, res) => {
  try {
    const { sellerId, page = 1, limit = 10 } = req.query;
    if (!sellerId)
      return res.status(400).json({ message: "sellerId query param is required" });

    const store = await Store.findOne({ sellerId }).lean();
    if (!store) return res.status(404).json({ message: "Store not found" });

    const productIds = store.productIds.map(String);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const totalOrders = await Order.countDocuments({
      "items.productId": { $in: productIds },
    });

    const orders = await Order.find({ "items.productId": { $in: productIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const filteredOrders = orders.map((order) => {
      const sellerItems = order.items.filter((item) =>
        productIds.includes(item.productId)
      );
      const itemsTotal = sellerItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      return {
        ...order.toObject(),
        items: sellerItems,
        itemsTotal,
      };
    });

    res.status(200).json({
      orders: filteredOrders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error("Error in getStoreOrdersForAdmin:", err);
    res.status(500).json({ message: err.message });
  }
};

// ======================================================
// 📊 ANALYTICS / DASHBOARD DATA
// ======================================================

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

exports.getAnalytics = async (req, res) => {
  try {
    // ✅ Total Sales
    const totalSalesAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const totalSales = totalSalesAgg[0]?.total || 0;

    // ✅ Total Users
    const totalUsers = await User.countDocuments();

    // ✅ Active Stores (with products)
    const activeStores = await Store.countDocuments({
      productIds: { $exists: true, $ne: [] },
    });

    // ✅ Pending Orders
    const pendingOrders = await Order.countDocuments({
      paymentStatus: "pending",
    });

    // ✅ Monthly Sales (last 12 months)
    const salesByMonth = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$grandTotal" },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const salesData = monthNames.map((month, i) => {
      const match = salesByMonth.find((s) => s._id === i + 1);
      return { month, sales: match ? match.total : 0 };
    });

    // ✅ Store-wise Sales (Top 5)
    const storeSales = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.storeId",
          total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      totalSales,
      totalUsers,
      activeStores,
      pendingOrders,
      salesData,
      storeSales,
    });
  } catch (err) {
    console.error("Error in getAnalytics:", err);
    res.status(500).json({ message: "Failed to load analytics", error: err.message });
  }
};

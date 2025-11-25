// backend/src/controllers/orderController.js
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Store = require("../models/Store");
const generateTrackingId = require("../utils/trackingId");

// =============================
// Create new order
// =============================
// =============================
// Create new order
// =============================
exports.createOrder = async (req, res) => {
  try {
    const firebaseUid = req.user.uid; // from requireAuth
    const {
      firstName,
      lastName,
      phone,
      email,
      houseAddress,
      items,
      shippingFee = 0,
      paymentMethod,
    } = req.body;

    // ----------------------------
    // Validate required fields
    // ----------------------------
    if (!firstName || !lastName || !phone || !email || !houseAddress || !items?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ----------------------------
    // Find the MongoDB user
    // ----------------------------
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // ----------------------------
    // Build items with correct data
    // ----------------------------
    const rebuiltItems = await Promise.all(
      items.map(async (item) => {
        // item.productId from frontend = MongoDB _id
        const product = await Product.findById(item.productId).select(
          "productId productDisplayName"
        );

        if (!product)
          throw new Error(`Product not found: ${item.productId}`);

        // find store by dataset productId (string like "59263")
        const store = await Store.findOne({ productIds: product.productId });

        if (!store)
          throw new Error(`Store not found for product: ${product.productId}`);

        return {
          productId: product.productId, // dataset ID like "59263"
          name: product.productDisplayName,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          storeId: store._id,
          itemPaymentStatus: "pending",
        };
      })
    );

    // ----------------------------
    // Calculate totals
    // ----------------------------
    const itemsTotal = rebuiltItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );

    const grandTotal = itemsTotal + Number(shippingFee);
    const trackingId = generateTrackingId();

    // ----------------------------
    // Create order document
    // ----------------------------
    const order = new Order({
      user: user._id,
      firstName,
      lastName,
      phone,
      email,
      houseAddress,
      items: rebuiltItems,
      itemsTotal,
      shippingFee,
      grandTotal,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "pending",
      trackingId,
    });

    await order.save();

    // ----------------------------
    // Payment method handling
    // ----------------------------
    if (paymentMethod === "JazzCash") {
      const paymentUrl = `${process.env.CORS_ORIGINS}/checkout?orderId=${order._id}`;
      return res.json({
        orderId: order._id,
        trackingId: order.trackingId,
        paymentUrl,
      });
    }

    // ----------------------------
    // COD success
    // ----------------------------
    return res.status(201).json({
      orderId: order._id,
      trackingId: order.trackingId,
    });

  } catch (err) {
    console.error("createOrder error:", err.message);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};


// =============================
// Get a single order by ID
// =============================
exports.getOrder = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const { id } = req.params;

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(order);
  } catch (err) {
    console.error("getOrder error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// =============================
// Get all orders for logged-in user (with pagination)
// =============================
exports.getMyOrders = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Pagination query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; // default 5 per page
    const skip = (page - 1) * limit;

    // ✅ Total count
    const totalOrders = await Order.countDocuments({ user: user._id });
    const totalPages = Math.ceil(totalOrders / limit);

    // ✅ Paginated orders
    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      orders,
      totalPages,
      currentPage: page,
      totalOrders,
    });
  } catch (err) {
    console.error("getMyOrders error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


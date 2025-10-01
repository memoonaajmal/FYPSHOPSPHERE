// backend/src/controllers/orderController.js
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Store = require("../models/Store");
const generateTrackingId = require("../utils/trackingId");

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

    // ✅ Validate required fields
    if (
      !firstName ||
      !lastName ||
      !phone ||
      !email ||
      !houseAddress ||
      !items?.length
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Find the MongoDB user based on email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Rebuild items with correct productId and storeId
    const rebuiltItems = await Promise.all(
      items.map(async (item) => {
        // Find the product by MongoDB _id (from frontend cart)
        const product = await Product.findById(item.productId).select(
          "productId productDisplayName"
        );
        if (!product) throw new Error(`Product not found: ${item.productId}`);

        // ✅ Find the store that sells this product (match via productId in its productIds array)
        const store = await Store.findOne({ productIds: product.productId });
        if (!store) {
          throw new Error(`Store not found for product ID: ${product.productId}`);
        }

        return {
          productId: product.productId, // ✅ your dataset product ID
          name: product.productDisplayName || item.name,
          price: item.price,
          quantity: item.quantity,
          storeId: store._id, // ✅ string ID like "store_watch"
          itemPaymentStatus: "pending",
        };
      })
    );

    // ✅ Calculate totals
    const itemsTotal = rebuiltItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );
    const grandTotal = itemsTotal + Number(shippingFee);
    const trackingId = generateTrackingId();

    // ✅ Create order document
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
      paymentMethod,
      paymentStatus: "pending",
      trackingId,
    });

    await order.save();

    // ✅ Payment flow handling
    if (paymentMethod === "JazzCash") {
      const paymentUrl = `${process.env.CORS_ORIGINS}/checkout?orderId=${order._id}`;
      return res.status(201).json({
        orderId: order._id,
        trackingId: order.trackingId,
        paymentUrl,
      });
    }

    // ✅ COD success
    return res.status(201).json({
      orderId: order._id,
      trackingId: order.trackingId,
    });
  } catch (err) {
    console.error("createOrder error:", err);
    res.status(500).json({ message: "Server error" });
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
// Get all orders for logged-in user
// =============================
exports.getMyOrders = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error("getMyOrders error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

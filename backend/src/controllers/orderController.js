// backend/src/controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User'); // ✅ added
const generateTrackingId = require('../utils/trackingId');

// Create new order
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

    if (
      !firstName ||
      !lastName ||
      !phone ||
      !email ||
      !houseAddress ||
      !items?.length
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ Find the MongoDB user based on Firebase UID or email
    const user = await User.findOne({ email }); // or use firebaseUid if you store it
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Rebuild items so productId is always the custom one
    const rebuiltItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId).select(
          'productId productDisplayName'
        );
        if (!product) throw new Error(`Product not found: ${item.productId}`);

        return {
          productId: product.productId, // ✅ use custom productId
          name: product.productDisplayName || item.name,
          price: item.price,
          quantity: item.quantity,
        };
      })
    );

    const itemsTotal = rebuiltItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );
    const grandTotal = itemsTotal + Number(shippingFee);
    const trackingId = generateTrackingId();

    // ✅ Use MongoDB _id for user
    const order = new Order({
      user: user._id,
      firstName,
      lastName,
      phone,
      email,
      houseAddress,
      items: rebuiltItems, // ✅ consistent productId
      itemsTotal,
      shippingFee,
      grandTotal,
      paymentMethod,
      paymentStatus: 'pending',
      trackingId,
    });

    await order.save();

    // If JazzCash, return paymentUrl placeholder
    if (paymentMethod === 'JazzCash') {
      const paymentUrl = `${process.env.CORS_ORIGINS}/checkout?orderId=${order._id}`;
      return res.status(201).json({
        orderId: order._id,
        trackingId: order.trackingId,
        paymentUrl,
      });
    }

    // COD success
    return res.status(201).json({
      orderId: order._id,
      trackingId: order.trackingId,
    });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single order by id
exports.getOrder = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;
    const { id } = req.params;

    // ✅ Find the user MongoDB _id first
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.user.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(order);
  } catch (err) {
    console.error('getOrder error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all orders for the logged-in user
exports.getMyOrders = async (req, res) => {
  try {
    const firebaseUid = req.user.uid;

    // ✅ Get MongoDB user ID
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('getMyOrders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

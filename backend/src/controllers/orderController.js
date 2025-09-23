// backend/src/controllers/orderController.js
const Order = require('../models/Order');
const Product = require('../models/Product');
const generateTrackingId = require('../utils/trackingId');

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.uid; // from requireAuth
    const {
      firstName, lastName, phone, email, houseAddress,
      items, shippingFee = 0, paymentMethod
    } = req.body;

    if (!firstName || !lastName || !phone || !email || !houseAddress || !items?.length) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ Rebuild items so productId is always the custom one
    const rebuiltItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId)
          .select("productId productDisplayName");
        if (!product) throw new Error(`Product not found: ${item.productId}`);

        return {
          productId: product.productId,              // ✅ use custom productId
          name: product.productDisplayName || item.name,
          price: item.price,
          quantity: item.quantity,
        };
      })
    );

    const itemsTotal = rebuiltItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const grandTotal = itemsTotal + Number(shippingFee);
    const trackingId = generateTrackingId();

    const order = new Order({
      user: userId,
      firstName,
      lastName,
      phone,
      email,
      houseAddress,
      items: rebuiltItems,   // ✅ consistent productId
      itemsTotal,
      shippingFee,
      grandTotal,
      paymentMethod,
      paymentStatus: 'pending',
      trackingId
    });

    await order.save();

    // If JazzCash, return paymentUrl placeholder
    if (paymentMethod === 'JazzCash') {
      const paymentUrl = `${process.env.CORS_ORIGINS}/checkout?orderId=${order._id}`;
      return res.status(201).json({
        orderId: order._id,
        trackingId: order.trackingId,
        paymentUrl
      });
    }

    // COD success
    return res.status(201).json({
      orderId: order._id,
      trackingId: order.trackingId
    });
  } catch (err) {
    console.error('createOrder error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single order by id
exports.getOrder = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user.toString() !== userId) return res.status(403).json({ message: 'Forbidden' });
    res.json(order);
  } catch (err) {
    console.error('getOrder error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all orders for the logged-in user
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.uid;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('getMyOrders error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

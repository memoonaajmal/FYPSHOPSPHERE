// backend/src/routes/seller.routes.js
const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

const {
  addProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getMyOrders,
  markItemsPaid,
} = require('../controllers/sellerController');

const User = require('../models/User');
const Store = require('../models/Store');

// -----------------------------
// ✅ Get seller info (for frontend /api/seller/me)
// -----------------------------
router.get('/me', requireAuth, requireRole('seller'), async (req, res) => {
  try {
    // find the user
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // find their store
    const store = await Store.findOne({ sellerId: user._id });
    if (!store) return res.status(404).json({ message: 'Store not found' });

    res.json({
      sellerId: user._id,
      email: user.email,
      storeId: store._id,
      storeName: store.name,
    });
  } catch (err) {
    console.error('GET /api/seller/me error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// -----------------------------
// Seller Product Management
// -----------------------------
router.post('/products', requireAuth, requireRole('seller'), addProduct);
router.get('/products', requireAuth, requireRole('seller'), getMyProducts);
router.put('/products/:id', requireAuth, requireRole('seller'), updateProduct);
router.delete('/products/:id', requireAuth, requireRole('seller'), deleteProduct);

// -----------------------------
// Seller Orders (only his products in each order)
// -----------------------------
router.get('/orders', requireAuth, requireRole('seller'), getMyOrders);

// 🆕 mark items paid
router.put('/orders/:orderId/pay', requireAuth, requireRole('seller'), markItemsPaid);

module.exports = router;

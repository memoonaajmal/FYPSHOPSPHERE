const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

const {
  addProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
  getMyOrders,
  updateItemStatus,
  getOrderById,
} = require('../controllers/sellerController');

const User = require('../models/User');
const Store = require('../models/Store');

router.get('/me', requireAuth, requireRole('seller'), async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

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

// Products
router.post('/products', requireAuth, requireRole('seller'), addProduct);
router.get('/products', requireAuth, requireRole('seller'), getMyProducts);
router.put('/products/:id', requireAuth, requireRole('seller'), updateProduct);
router.delete('/products/:id', requireAuth, requireRole('seller'), deleteProduct);

// Orders
router.get('/orders', requireAuth, requireRole('seller'), getMyOrders);
// Get single order details
router.get("/orders/:orderId", requireAuth, requireRole('seller'), getOrderById);

// 🆕 Mark items as paid OR returned
router.put('/orders/:orderId/status', requireAuth, requireRole('seller'), updateItemStatus);

module.exports = router;

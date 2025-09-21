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
} = require('../controllers/sellerController');

// Example seller dashboard endpoint (unchanged ✅)
router.get('/dashboard', requireAuth, requireRole('seller'), async (req, res) => {
  res.json({ message: `Welcome seller ${req.user.email}` });
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

module.exports = router;

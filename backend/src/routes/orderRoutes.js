// backend/src/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const { createOrder, getOrder, getMyOrders } = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

// Create new order (checkout) → only logged-in users
router.post('/', requireAuth, createOrder);

// Get single order by id → only logged-in user who placed it
router.get('/:id', requireAuth, getOrder);

// (optional) Get all orders for current logged-in user
router.get('/', requireAuth, getMyOrders);

module.exports = router;

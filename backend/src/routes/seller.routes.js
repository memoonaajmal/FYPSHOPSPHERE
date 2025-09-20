// backend/src/routes/seller.routes.js
const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');

// Example seller dashboard endpoint
router.get('/dashboard', requireAuth, requireRole('seller'), async (req, res) => {
  res.json({ message: `Welcome seller ${req.user.email}` });
});

module.exports = router;

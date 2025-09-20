const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const User = require('../models/User');

// Admin dashboard stats
router.get('/stats', requireAuth, requireRole('admin'), async (req, res) => {
  const totalUsers = await User.countDocuments();
  const sellers = await User.countDocuments({ roles: 'seller' });
  res.json({ totalUsers, sellers });
});

// Promote a user (admin only)
router.post('/promote', requireAuth, requireRole('admin'), async (req, res) => {
  const { email, newRole } = req.body;
  if (!['user', 'seller'].includes(newRole)) {
    return res.status(400).json({ error: { message: 'Invalid role' } });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error: { message: 'User not found' } });

  if (!user.roles.includes(newRole)) {
    user.roles.push(newRole);
    await user.save();
  }

  res.json({ message: 'User updated', user });
});

module.exports = router;

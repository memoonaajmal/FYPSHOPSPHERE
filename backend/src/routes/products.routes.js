const express = require('express');
const router = express.Router();
const controller = require('../controllers/products.controller');
const { requireAuth, requireRole } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimit');

router.get('/', searchLimiter, controller.list);
router.get('/:productId', controller.getOne);

// Admin routes
router.post('/', requireAuth, requireRole('admin'), controller.create);
router.patch('/:productId', requireAuth, requireRole('admin'), controller.update);
router.delete('/:productId', requireAuth, requireRole('admin'), controller.remove);

module.exports = router;

// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const { sync, me, updateProfile } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

router.post('/sync', requireAuth, sync);
router.get('/me', requireAuth, me);
router.put("/profile", requireAuth, updateProfile);

module.exports = router;

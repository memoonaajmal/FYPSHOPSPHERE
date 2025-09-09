const express = require('express');
const router = express.Router();
const { facets } = require('../controllers/facets.controller');
router.get('/', facets);
module.exports = router;

const express = require('express');
const router = express.Router();
const { preparePayment, callbackHandler } = require('../controllers/jazzcashController');
const { requireAuth } = require('../middleware/auth');

// prepare endpoint (frontend calls this with the logged-in user's token)
router.get('/prepare', requireAuth, preparePayment);

// public callback that JazzCash will POST to
router.options('/callback', (req, res) => {
  // handle preflight requests
  res.setHeader('Access-Control-Allow-Origin', '*'); // allow all origins (sandbox)
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

router.post('/callback', express.urlencoded({ extended: true }), (req, res, next) => {
  // set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // allow JazzCash sandbox
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  callbackHandler(req, res, next);
});

module.exports = router;

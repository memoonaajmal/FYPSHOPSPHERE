const express = require("express");
const router = express.Router();
const {
  createStripePaymentIntent,
  handleStripeWebhook,
} = require("../controllers/stripeController");

// ── WEBHOOK — raw body required for Stripe signature verification ─────────────
// Must NOT go through express.json() — uses express.raw() instead
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

// ── CREATE PAYMENT INTENT — needs JSON body parser applied locally ────────────
// Since this router is mounted before global express.json() in server.js,
// we apply express.json() here just for this route
router.post(
  "/create-payment-intent",
  express.json(),
  createStripePaymentIntent
);

module.exports = router;
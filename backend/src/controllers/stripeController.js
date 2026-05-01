const Stripe = require("stripe");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const Store = require("../models/Store");
const generateTrackingId = require("../utils/trackingId");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * STEP 1: Create Stripe Payment Intent + Create Order (pending)
 * Mirrors the same item-rebuilding logic as orderController.createOrder
 */
exports.createStripePaymentIntent = async (req, res) => {
  try {
    const {
      user: firebaseUid,
      items,
      shippingFee = 0,
      firstName,
      lastName,
      phone,
      email,
      houseAddress,
    } = req.body;

    // ── Validation ────────────────────────────────────────────────────────
    if (
      !firebaseUid ||
      !items ||
      !items.length ||
      !firstName ||
      !lastName ||
      !phone ||
      !email ||
      !houseAddress
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required order data",
      });
    }

    // ── Resolve Firebase UID → MongoDB user ──────────────────────────────
    const dbUser = await User.findOne({ firebaseUid });
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please log in again.",
      });
    }

    // ── Rebuild items server-side (same as orderController) ──────────────
    // Looks up product + store so storeId is always correct and trusted
    const rebuiltItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId).select(
          "productId productDisplayName"
        );
        if (!product) throw new Error(`Product not found: ${item.productId}`);

        const store = await Store.findOne({ productIds: product.productId });
        if (!store)
          throw new Error(`Store not found for product: ${product.productId}`);

        return {
          productId: product.productId,
          name: product.productDisplayName,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          storeId: store._id,
          itemPaymentStatus: "pending",
        };
      })
    );

    // ── Calculate totals ──────────────────────────────────────────────────
    const itemsTotal = rebuiltItems.reduce(
      (sum, it) => sum + it.price * it.quantity,
      0
    );
    const grandTotal = itemsTotal + Number(shippingFee);

    if (grandTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid grand total",
      });
    }

    // ── Create Stripe Payment Intent ──────────────────────────────────────
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(grandTotal * 100), // PKR → paisa
      currency: "pkr",
      payment_method_types: ["card"],
    });

    // ── Prevent duplicate orders ──────────────────────────────────────────
    const existingOrder = await Order.findOne({
      stripePaymentIntentId: paymentIntent.id,
    });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: "Order already exists for this payment",
      });
    }

    // ── Create Order in MongoDB (pending) ─────────────────────────────────
    const trackingId = generateTrackingId(); // same util as orderController
    const order = await Order.create({
      user: dbUser._id,
      firstName,
      lastName,
      phone,
      email,
      houseAddress,
      items: rebuiltItems,
      itemsTotal,
      shippingFee,
      grandTotal,
      paymentMethod: "Stripe",
      paymentStatus: "pending",
      trackingId,
      stripePaymentIntentId: paymentIntent.id,
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      orderId: order._id,
      trackingId: order.trackingId,
    });
  } catch (error) {
    console.error("Stripe Controller Error:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * STEP 2: Stripe Webhook — updates order paymentStatus to "paid"
 * after Stripe confirms the payment on their end.
 *
 * IMPORTANT: This route must receive the RAW request body (not JSON-parsed).
 * In stripe.routes.js, register this route BEFORE express.json() middleware,
 * or use express.raw() specifically for this route (see stripe.routes.js below).
 */
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  // ── Verify the webhook signature ─────────────────────────────────────────
  // req.body must be the raw Buffer here — not parsed JSON
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ── Handle payment_intent.succeeded ──────────────────────────────────────
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    try {
      const order = await Order.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        {
          paymentStatus: "paid",
          // Also mark every item as paid
          $set: {
            "items.$[].itemPaymentStatus": "paid",
          },
        },
        { new: true }
      );

      if (!order) {
        console.warn("Webhook: No order found for paymentIntent:", paymentIntent.id);
      } else {
        console.log("Webhook: Order marked as paid:", order.trackingId);
      }
    } catch (err) {
      console.error("Webhook: Failed to update order:", err.message);
      // Still return 200 so Stripe doesn't retry endlessly
    }
  }

  // ── Handle payment_intent.payment_failed (optional but recommended) ──────
  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;

    try {
      await Order.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        { paymentStatus: "failed" }
      );
      console.log("Webhook: Order marked as failed for paymentIntent:", paymentIntent.id);
    } catch (err) {
      console.error("Webhook: Failed to mark order as failed:", err.message);
    }
  }

  // Always return 200 to acknowledge receipt
  res.status(200).json({ received: true });
};
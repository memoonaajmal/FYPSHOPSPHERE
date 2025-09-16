// backend/src/controllers/jazzcashController.js
const Order = require("../models/Order");
const { generateSecureHash, formatTxnDate } = require("../utils/jazzcash");
const mongoose = require("mongoose");

/**
 * Prepare payment fields for JazzCash
 */
exports.preparePayment = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { orderId } = req.query;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid orderId" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user.toString() !== userId)
      return res.status(403).json({ message: "Forbidden" });
    if (order.paymentMethod !== "JazzCash")
      return res.status(400).json({ message: "Order not set for JazzCash" });

    const amountInt = Math.round(Number(order.grandTotal) * 100);
    const txnRefNo = `T${Date.now()}`;
    const now = new Date();
    const pp_TxnDateTime = formatTxnDate(now);
    const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour expiry
    const pp_TxnExpiryDateTime = formatTxnDate(expiry);

    const ppFields = {
      pp_Version: "1.1",
      pp_TxnType: "", // Fill if needed
      pp_Language: "EN",
      pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID,
      pp_Password: process.env.JAZZCASH_PASSWORD,
      pp_TxnRefNo: txnRefNo,
      pp_Amount: String(amountInt),
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime,
      pp_TxnExpiryDateTime,
      pp_BillReference: order.trackingId,
      pp_Description: `Order ${order.trackingId}`,
      pp_ReturnURL: process.env.JAZZCASH_RETURN_URL,
      ppmpf_1: String(order._id),
      ppmpf_2: "",
      ppmpf_3: "",
      ppmpf_4: "",
      ppmpf_5: "",
    };

    // Generate secure hash
    ppFields.pp_SecureHash = generateSecureHash(
      ppFields,
      process.env.JAZZCASH_INTEGRITY_SALT
    );

    return res.json({
      paymentUrl: process.env.JAZZCASH_ENDPOINT,
      paymentFields: ppFields,
    });
  } catch (err) {
    console.error("preparePayment error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Handle JazzCash callback
 */
exports.callbackHandler = async (req, res) => {
  try {
    const data = req.body || {};
    console.log("JazzCash callback data:", data);

    const receivedHash = (data.pp_SecureHash || "").toUpperCase();
    let recomputed;
    try {
      recomputed = generateSecureHash(data, process.env.JAZZCASH_INTEGRITY_SALT);
    } catch (hashErr) {
      console.error("Secure hash generation error:", hashErr);
      return res.status(400).send("Invalid Secure Hash");
    }

    if (recomputed !== receivedHash) {
      console.error("JazzCash secure hash mismatch", { receivedHash, recomputed });
      return res.status(400).send("Invalid Secure Hash");
    }

    const billRef = data.pp_BillReference;
    const respCode = data.pp_ResponseCode;

    const order = await Order.findOne({ trackingId: billRef });
    if (!order) {
      console.warn("Order not found for billRef:", billRef);
      return res.status(200).send("OK"); // Respond even if order not found
    }

    order.paymentStatus = respCode === "000" ? "paid" : "failed";

    try {
      await order.save();
    } catch (saveErr) {
      console.error("Failed to save order:", saveErr);
    }

    // Redirect to frontend (status=success or failed)
    const frontendRedirect = `${process.env.CORS_ORIGINS || ""}/checkout?trackingId=${order.trackingId}&status=${respCode === '000' ? 'success' : 'failed'}`;
    console.log("Redirecting to frontend:", frontendRedirect);

    return res.send(`
      <html>
        <body>
          <form id="redirectForm" action="${frontendRedirect}" method="GET"></form>
          <script>document.getElementById('redirectForm').submit();</script>
        </body>
      </html>
    `);

  } catch (err) {
    console.error("callbackHandler error:", err);
    res.status(500).send("Server error");
  }
};

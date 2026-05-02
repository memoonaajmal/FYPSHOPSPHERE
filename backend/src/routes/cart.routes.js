// src/routes/cart.routes.js
const express = require("express");
const Cart = require("../models/Cart");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// All routes require auth
router.use(requireAuth);

// ── GET /api/cart ──────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.uid });
    res.json(cart?.items || []);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch cart" });
  }
});
router.post("/merge", async (req, res) => {
  try {
    const { items: guestItems } = req.body;
    if (!Array.isArray(guestItems)) return res.status(400).json({ message: "Invalid items" });

    let cart = await Cart.findOne({ userId: req.user.uid });

    if (!cart) {
      cart = await Cart.create({ userId: req.user.uid, items: guestItems });
      return res.json(cart.items);
    }

    for (const guestItem of guestItems) {
      const existing = cart.items.find((i) => i.productId === guestItem.id);
      if (existing) {
        existing.qty = guestItem.qty; // ✅ REPLACE, don't add — guest cart is the latest intent
      } else {
        cart.items.push({
          productId: guestItem.id,
          storeId:   guestItem.storeId,
          name:      guestItem.name,
          price:     guestItem.price,
          image:     guestItem.image,
          qty:       guestItem.qty,
        });
      }
    }

    await cart.save();
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: "Merge failed" });
  }
});

// ── POST /api/cart ─────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { id, storeId, name, price, image, qty = 1 } = req.body;

    let cart = await Cart.findOne({ userId: req.user.uid });

    if (!cart) {
      cart = await Cart.create({
        userId: req.user.uid,
        items: [{ productId: id, storeId, name, price, image, qty }],
      });
      return res.json(cart.items);
    }

    const existing = cart.items.find((i) => i.productId === id);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.items.push({ productId: id, storeId, name, price, image, qty });
    }

    await cart.save();
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: "Failed to add item" });
  }
});

// ── PUT /api/cart/:productId ───────────────────────────────
router.put("/:productId", async (req, res) => {
  try {
    const { qty } = req.body;
    const cart = await Cart.findOne({ userId: req.user.uid });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((i) => i.productId === req.params.productId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (qty <= 0) {
      cart.items = cart.items.filter((i) => i.productId !== req.params.productId);
    } else {
      item.qty = qty;
    }

    await cart.save();
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: "Failed to update item" });
  }
});

// ── DELETE /api/cart/:productId ────────────────────────────
router.delete("/:productId", async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.uid });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((i) => i.productId !== req.params.productId);
    await cart.save();
    res.json(cart.items);
  } catch (err) {
    res.status(500).json({ message: "Failed to remove item" });
  }
});

// ── DELETE /api/cart ───────────────────────────────────────
router.delete("/", async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ userId: req.user.uid }, { items: [] });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

module.exports = router;
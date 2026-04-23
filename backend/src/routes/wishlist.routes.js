// src/routes/wishlist.routes.js
const express = require("express");
const Wishlist = require("../models/Wishlist");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// All routes require auth
router.use(requireAuth);

// ── GET /api/wishlist ──────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.uid });
    res.json(wishlist?.items || []);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch wishlist" });
  }
});

// ── POST /api/wishlist/merge ───────────────────────────────
router.post("/merge", async (req, res) => {
  try {
    const { items: guestItems } = req.body;
    if (!Array.isArray(guestItems)) return res.status(400).json({ message: "Invalid items" });

    let wishlist = await Wishlist.findOne({ userId: req.user.uid });

    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user.uid, items: guestItems });
      return res.json(wishlist.items);
    }

    for (const guestItem of guestItems) {
      const existing = wishlist.items.find((i) => i.productId === guestItem.id);
      if (!existing) {
        // Only add if not already in wishlist (no qty to merge)
        wishlist.items.push({
          productId: guestItem.id,
          storeId:   guestItem.storeId,
          name:      guestItem.name,
          price:     guestItem.price,
          image:     guestItem.image,
        });
      }
    }

    await wishlist.save();
    res.json(wishlist.items);
  } catch (err) {
    res.status(500).json({ message: "Merge failed" });
  }
});

// ── POST /api/wishlist ─────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { id, storeId, name, price, image } = req.body;

    let wishlist = await Wishlist.findOne({ userId: req.user.uid });

    if (!wishlist) {
      wishlist = await Wishlist.create({
        userId: req.user.uid,
        items: [{ productId: id, storeId, name, price, image }],
      });
      return res.json(wishlist.items);
    }

    const existing = wishlist.items.find((i) => i.productId === id);
    if (!existing) {
      // Only add if not already in wishlist
      wishlist.items.push({ productId: id, storeId, name, price, image });
      await wishlist.save();
    }

    res.json(wishlist.items);
  } catch (err) {
    res.status(500).json({ message: "Failed to add item" });
  }
});

// ── DELETE /api/wishlist/:productId ───────────────────────
router.delete("/:productId", async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.uid });
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

    wishlist.items = wishlist.items.filter((i) => i.productId !== req.params.productId);
    await wishlist.save();
    res.json(wishlist.items);
  } catch (err) {
    res.status(500).json({ message: "Failed to remove item" });
  }
});

// ── DELETE /api/wishlist ───────────────────────────────────
router.delete("/", async (req, res) => {
  try {
    await Wishlist.findOneAndUpdate({ userId: req.user.uid }, { items: [] });
    res.json({ message: "Wishlist cleared" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear wishlist" });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  getHistory,
  saveMessage,
} = require("../controllers/chat.controller");

router.get("/history", requireAuth, getHistory);
router.post("/save", requireAuth, saveMessage);

module.exports = router;

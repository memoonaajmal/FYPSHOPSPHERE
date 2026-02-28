const express = require("express");
const router = express.Router();
const { getRecommendations } = require("../controllers/recommendation.controller");

const { requireAuth } = require("../middleware/auth"); // <- adjust path if needed

router.get("/recommendations", requireAuth, getRecommendations);

module.exports = router;
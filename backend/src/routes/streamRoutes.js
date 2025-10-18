const express = require("express");
const router = express.Router();
const streamController = require("../controllers/streamController");

router.post("/", streamController.createStream);
router.get("/", streamController.getAllStreams);
router.get("/:slug", streamController.getStreamBySlug);
router.post("/:id/end", streamController.endStream);

module.exports = router;

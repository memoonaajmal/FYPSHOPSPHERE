// backend/src/routes/uploadRoutes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Store in /public/images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/images"),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

router.post("/", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).send("No image uploaded");
  res.json({ filename: req.file.filename });
});

module.exports = router;

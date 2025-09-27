
const express = require("express");
const storeController = require("../controllers/store.controller");
const { requireAuth, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/", storeController.getStores);

// Check if seller has store
router.get("/check/exists", requireAuth, requireRole("seller"), storeController.checkSellerStore);


// Submit store creation request
router.post("/create-request",upload.fields([{ name: "cnicImage", maxCount: 1 },{ name: "logo", maxCount: 1 },{ name: "banner", maxCount: 1 },]),storeController.createStoreRequest);

router.get("/my-request", storeController.getMyStoreRequest);

router.get("/:id", storeController.getStoreWithProducts);

module.exports = router;
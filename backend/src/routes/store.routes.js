
const express = require("express");
const storeController = require("../controllers/store.controller");

const router = express.Router();

router.get("/", storeController.getStores);
router.get("/:id", storeController.getStoreWithProducts);

module.exports = router;

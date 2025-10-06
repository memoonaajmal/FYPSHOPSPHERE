// backend/src/routes/analyticsRoutes.js
const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { requireAuth } = require("../middleware/auth");

router.get("/dashboard", requireAuth, analyticsController.getDashboardAnalytics);
router.get("/sales", requireAuth, analyticsController.getSalesAnalytics);
router.get("/top-customers", requireAuth, analyticsController.getTopCustomers);
router.get("/customer-summary", requireAuth, analyticsController.getCustomerSummary);


module.exports = router;

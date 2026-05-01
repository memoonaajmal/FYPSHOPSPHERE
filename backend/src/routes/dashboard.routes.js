const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const {
  getAllUsers,

  getAnalytics, 

  getAllStoresWithStats,
  getRecentOrders,
 getRecentStores
} = require("../controllers/dashboardController");


// Get all users
router.get("/users",getAllUsers);



// Admin: Get all store orders
router.get("/orders", requireAuth, requireRole("admin"), getStoreOrdersForAdmin);

// Admin: Get analytics summary
router.get("/analytics", requireAuth, requireRole("admin"), getAnalytics); 
router.get("/stores", requireAuth, requireRole("admin"),getAllStoresWithStats);
router.get("/recent-orders",requireAuth, requireRole("admin"),  getRecentOrders);


module.exports = router;

const express = require("express");
const router = express.Router();
const { requireAuth, } = require("../middleware/auth");
const {
  getAllUsers,

  getAnalytics, 

  getAllStoresWithStats,
  getRecentOrders,

} = require("../controllers/dashboardController");


// Get all users
router.get("/users",getAllUsers);


// Admin: Get analytics summary
router.get("/analytics", getAnalytics); 
router.get("/stores",getAllStoresWithStats);
router.get("/recent-orders",  getRecentOrders);


module.exports = router;

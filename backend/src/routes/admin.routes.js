const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");

// Import all controller functions (including getAnalytics)
const {
  getAllUsers,
  getUserById,
  deleteUser,
  getOrdersByEmail,
  getAllStoreRequests,
  getStoreRequestById,
  updateStoreRequestStatus,
  getStoreOrdersForAdmin,
  getAnalytics, // ✅ added

  getAllStoresWithStats,
  getRecentOrders,
 getRecentStores
} = require("../controllers/adminController");

// ==================== USER ROUTES ====================

// Get all users
router.get("/users", getAllUsers);

// Get single user
router.get("/users/:id", getUserById);

// Delete user
router.delete("/users/:id", deleteUser);

// Get orders by email
router.get("/email/:email", getOrdersByEmail);

// ==================== STORE REQUEST ROUTES ====================

// Fetch all store requests
router.get("/store-requests", getAllStoreRequests);

// Get a single store request by ID
router.get("/store-requests/:id", getStoreRequestById);

// Update store request status (approve/reject)
router.patch("/store-requests/:id", updateStoreRequestStatus);

// ==================== STORE ORDERS & ANALYTICS ====================

// Admin: Get all store orders
router.get("/orders", requireAuth, requireRole("admin"), getStoreOrdersForAdmin);

// Admin: Get analytics summary
router.get("/analytics", requireAuth, requireRole("admin"), getAnalytics); // ✅ fixed
router.get("/stores", getAllStoresWithStats);
router.get("/recent-orders",  getRecentOrders);


module.exports = router;

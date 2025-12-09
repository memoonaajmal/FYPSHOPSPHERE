const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");

const {
  getAllUsers,
  getUserById,
  deleteUser,
  getOrdersByEmail,
  getAllStoreRequests,
  getStoreRequestById,
  updateStoreRequestStatus,
  getStoreOrdersForAdmin,
  getAnalytics, 

  getAllStoresWithStats,
  getRecentOrders,
 getRecentStores
} = require("../controllers/adminController");


// Get all users
router.get("/users",getAllUsers);

// Get single user
router.get("/users/:id",requireAuth, requireRole("admin"), getUserById);

// Delete user
router.delete("/users/:id", requireAuth, requireRole("admin"),deleteUser);

// Get orders by email
router.get("/email/:email", requireAuth, requireRole("admin"),getOrdersByEmail);


// Fetch all store requests
router.get("/store-requests", getAllStoreRequests);

// Get a single store request by ID
router.get("/store-requests/:id",getStoreRequestById);

// Update store request status (approve/reject)
router.patch("/store-requests/:id", updateStoreRequestStatus);


// Admin: Get all store orders
router.get("/orders", requireAuth, requireRole("admin"), getStoreOrdersForAdmin);

// Admin: Get analytics summary
router.get("/analytics", requireAuth, requireRole("admin"), getAnalytics); 
router.get("/stores", requireAuth, requireRole("admin"),getAllStoresWithStats);
router.get("/recent-orders",requireAuth, requireRole("admin"),  getRecentOrders);


module.exports = router;

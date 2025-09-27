const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const {getAllUsers,getUserById,deleteUser,getOrdersByEmail, getAllStoreRequests,
    getStoreRequestById,
  updateStoreRequestStatus
 } = require("../controllers/adminController");

// Get all users
router.get("/users", getAllUsers);

// Get single user
router.get("/users/:id", getUserById);

// Delete user
router.delete("/users/:id", deleteUser);

router.get("/email/:email", getOrdersByEmail);

// Fetch all store requests
router.get("/store-requests",getAllStoreRequests);

// New routes for detail + status update
router.get("/store-requests/:id", getStoreRequestById);
router.patch("/store-requests/:id",updateStoreRequestStatus);

module.exports = router;

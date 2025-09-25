const express = require("express");
const router = express.Router();
const { requireAuth, requireRole } = require("../middleware/auth");
const {getAllUsers,getUserById,deleteUser,getOrdersByEmail} = require("../controllers/adminController");

// Get all users
router.get("/users", getAllUsers);

// Get single user
router.get("/users/:id", getUserById);

// Delete user
router.delete("/users/:id", deleteUser);

router.get("/email/:email", getOrdersByEmail);

module.exports = router;

// Sync Firebase user with MongoDB
const User = require("../models/User");


exports.sync = async function (req, res, next) {
  try {
    if (req.method === "OPTIONS") return res.status(204).end();

    if (!req.user) {
      return res.status(400).json({ error: "req.user is missing. Did you send a valid Firebase token?" });
    }

    const { uid, email, name, mongoUser } = req.user;

    if (!uid || !email) {
      return res.status(400).json({ error: "Invalid Firebase user payload" });
    }

    const body = req.body || {};
    let { role } = body;
    role = (role || "user").toLowerCase().trim();
    const allowedRoles = ["user", "seller"];
    const finalRole = allowedRoles.includes(role) ? role : "user";

    let user = mongoUser;

    // ✅ Always ensure user exists in MongoDB
    if (!user) {
      user = new User({
        email,
        name: name || "",
        passwordHash: "",
        roles: [finalRole],
        firebaseUid: uid,
      });
      await user.save();
      console.log("Created new user with role:", finalRole);
    } else {
      // ✅ Patch firebaseUid if missing
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        await user.save();
        console.log("Patched user with Firebase UID");
      }

      // ✅ Assign default role if missing
      if (!user.roles || user.roles.length === 0) {
        user.roles = [finalRole];
        await user.save();
        console.log("Updated existing user with role:", finalRole);
      }
    }

    // ✅ Ensure only one role if admin
    if (user && user.roles.includes("admin")) {
      user.roles = ["admin"];
      await user.save();
    }

    // ✅ Ensure seller is not mixed with user
    if (user && user.roles.includes("seller") && user.roles.includes("user")) {
      user.roles = ["seller"];
      await user.save();
    }

    // ✅ Response back with both Firebase + Mongo info
    res.json({
      user: {
        _id: user._id,      // MongoDB ObjectId
        uid,                // Firebase UID
        email,
        name: user.name,
        roles: user.roles,
        firebaseUid: user.firebaseUid,
      },
    });
  } catch (err) {
    console.error("Error in /sync:", err);
    next(err);
  }
};


// Get current logged-in user info
exports.me = async function (req, res, next) {
  try {
    const { uid, email, mongoUser } = req.user;

    // ✅ If not in Mongo yet, create it
    if (!mongoUser) {
      const newUser = new User({
        email,
        name: "",
        passwordHash: "",
        roles: ["user"],
        firebaseUid: uid,
      });
      await newUser.save();

      return res.json({
        user: {
          _id: newUser._id,
          uid,
          email,
          name: newUser.name,
          roles: newUser.roles,
          firebaseUid: newUser.firebaseUid,
        },
      });
    }

    res.json({
      user: {
        _id: mongoUser._id,
        uid,
        email,
        name: mongoUser.name,
        roles: mongoUser.roles,
        firebaseUid: mongoUser.firebaseUid || uid,
      },
    });
  } catch (err) {
    next(err);
  }
};

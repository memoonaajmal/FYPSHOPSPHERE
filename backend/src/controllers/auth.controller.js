// Sync Firebase user with MongoDB
const User = require("../models/User");

exports.sync = async function (req, res, next) {
  console.log("REQ.USER:", req.user);

  try {
    if (req.method === "OPTIONS") return res.status(204).end();

    if (!req.user) {
      return res.status(400).json({
        error: "req.user is missing. Did you send a valid Firebase token?",
      });
    }

    const { uid, email, name } = req.user;

    if (!uid || !email) {
      return res.status(400).json({ error: "Invalid Firebase user payload" });
    }

    const body = req.body || {};
    let { role } = body;
    role = (role || "user").toLowerCase().trim();
    const allowedRoles = ["user", "seller"];
    const finalRole = allowedRoles.includes(role) ? role : "user";

    // ✅ Check if user already exists in MongoDB
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // If not exists, create a new user
      user = new User({
        email,
        name: name || "",
        passwordHash: "",
        roles: [finalRole],
        firebaseUid: uid,
        phone: "",
        gender: "not_set",
        birthday: null,
      });
      await user.save();
      console.log("Created new user with role:", finalRole);
    } else {
      // Patch missing fields
      let modified = false;

      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        modified = true;
      }

      if (!user.roles || user.roles.length === 0) {
        user.roles = [finalRole];
        modified = true;
      }

      if (modified) await user.save();
    }

    // ✅ Ensure roles consistency
    if (user.roles.includes("admin")) user.roles = ["admin"];
    if (user.roles.includes("seller") && user.roles.includes("user"))
      user.roles = ["seller"];

    await user.save();

    res.json({
      user: {
        _id: user._id,
        uid, // Firebase UID
        email,
        name: user.name,
        roles: user.roles,
        firebaseUid: user.firebaseUid,
      },
    });
  } catch (err) {
    console.error("Error in /sync:", err);
    res.status(500).json({ error: err.message });
  }
};


// Get current logged-in user info
exports.me = async function (req, res, next) {
  try {
    const { uid, email, mongoUser } = req.user;

    // If not in Mongo yet, create it
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
        phone: mongoUser.phone || "",
        gender: mongoUser.gender || "Not Set",
        birthday: mongoUser.birthday || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/profile
exports.updateProfile = async function (req, res, next) {
  try {
    if (req.method === "OPTIONS") return res.status(204).end();

    // middleware should have attached req.user and req.user.mongoUser
    const mongoUser = req.user && req.user.mongoUser;
    if (!mongoUser)
      return res.status(401).json({ error: "Unauthorized - user not found" });

    // Only allow these fields to be updated from the client
    const allowed = ["name", "phone", "gender", "birthday"];
    allowed.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        if (field === "birthday") {
          mongoUser[field] = req.body[field] ? new Date(req.body[field]) : null;
        } else {
          mongoUser[field] = req.body[field];
        }
      }
    });

    await mongoUser.save();

    res.json({
      user: {
        _id: mongoUser._id,
        uid: mongoUser.firebaseUid,
        email: mongoUser.email,
        name: mongoUser.name,
        phone: mongoUser.phone,
        gender: mongoUser.gender,
        birthday: mongoUser.birthday,
        quickLoginEnabled: mongoUser.quickLoginEnabled,
        roles: mongoUser.roles,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.checkEmailExists = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const exists = await User.exists({ email: email.toLowerCase().trim() });
    res.json({ success: true, exists: !!exists });
  } catch (err) {
    console.error("Error checking email:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

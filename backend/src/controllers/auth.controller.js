const User = require("../models/User");

// Sync Firebase user with MongoDB
exports.sync = async function (req, res, next) {
  try {
    if (req.method === "OPTIONS") return res.status(204).end();

    const { uid, email, name, mongoUser } = req.user;

    // parse JSON body from frontend
    const body = await req.json?.() || req.body;
    let { role } = body;
    role = (role || "user").toLowerCase().trim();
    const allowedRoles = ["user", "seller"];
    const finalRole = allowedRoles.includes(role) ? role : "user";

    let user = mongoUser;

    if (!user) {
      // User does not exist: create with chosen role
      user = new User({
        email,
        name: name || "",
        passwordHash: "",
        roles: [finalRole],
      });
      await user.save();
      console.log("Created new user with role:", finalRole);
    } else if (!user.roles || user.roles.length === 0) {
      // Existing user with empty roles: set role
      user.roles = [finalRole];
      await user.save();
      console.log("Updated existing user with role:", finalRole);
    }

    // Normalize roles
    if (user.roles.includes("admin")) {
      user.roles = ["admin"];
      await user.save();
    }

    if (user.roles.includes("seller") && user.roles.includes("user")) {
      user.roles = ["seller"];
      await user.save();
    }

    res.json({
      user: {
        uid,
        email,
        name: user.name,
        roles: user.roles,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get current logged-in user info
exports.me = async function (req, res, next) {
  try {
    const { uid, email, mongoUser } = req.user;

    if (!mongoUser) {
      return res.json({
        user: { uid, email, name: null, roles: ["user"] },
      });
    }

    res.json({
      user: {
        uid,
        email,
        name: mongoUser.name,
        roles: mongoUser.roles,
      },
    });
  } catch (err) {
    next(err);
  }
};

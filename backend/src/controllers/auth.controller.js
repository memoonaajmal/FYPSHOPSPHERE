// backend/src/controllers/auth.controller.js
const User = require('../models/User'); // MongoDB model

// Sync user to MongoDB only
exports.sync = async function(req, res, next) {
  try {
    const { uid, email, name } = req.user;

    // Check if user already exists in MongoDB
    let mongoUser = await User.findOne({ email });
    if (!mongoUser) {
      mongoUser = new User({
        email,
        name,
        passwordHash: '', // Firebase handles auth, so leave empty
        roles: ['user'],
      });
      await mongoUser.save();
    }

    // Return user data from MongoDB
    res.json({ user: { uid, email, name, roles: mongoUser.roles } });
  } catch (err) {
    next(err);
  }
};

// Get current user info
exports.me = async function(req, res, next) {
  try {
    const { uid, email, name } = req.user;

    // Find user in MongoDB
    const mongoUser = await User.findOne({ email });

    if (!mongoUser) {
      return res.json({ user: { uid, email, name, roles: ['user'] } });
    }

    res.json({ user: { uid, email, name, roles: mongoUser.roles } });
  } catch (err) {
    next(err);
  }
};

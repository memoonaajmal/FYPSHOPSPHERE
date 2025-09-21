const admin = require('../utils/firebaseAdmin');
const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');

// Middleware: verify Firebase token & attach user to req
exports.requireAuth = async function (req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: { message: 'Missing token', code: 'UNAUTHORIZED' } });
    }

    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(token);
    const userRecord = await admin.auth().getUser(decoded.uid).catch(() => null);

    // Fetch user from MongoDB
    let mongoUser = await User.findOne({ email: decoded.email });

    // Attach user info to req (do NOT force roles here)
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: userRecord?.displayName || decoded.name || null,
      mongoUser, // attach Mongo record (can be null)
      roles: mongoUser?.roles || [],
    };

    next();
  } catch (err) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } });
  }
};


// Middleware: check if user has a role
exports.requireRole = function (role) {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];

    if (Array.isArray(userRoles) && userRoles.includes(role)) {
      return next();
    }

    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ error: { message: 'Forbidden - insufficient role', code: 'FORBIDDEN' } });
  };
};

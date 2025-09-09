// backend/src/middleware/auth.js
const admin = require('../utils/firebaseAdmin');
const { StatusCodes } = require('http-status-codes');

exports.requireAuth = async function(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(StatusCodes.UNAUTHORIZED).json({ error: { message: 'Missing token', code: 'UNAUTHORIZED' }});

    const decoded = await admin.auth().verifyIdToken(token); // verifies Firebase token
    const userRecord = await admin.auth().getUser(decoded.uid).catch(()=>null);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || (userRecord && userRecord.email),
      name: (userRecord && userRecord.displayName) || decoded.name || null,
      claims: decoded // includes custom claims if any
    };
    next();
  } catch (err) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED' }});
  }
};

exports.requireRole = function(role) {
  return (req, res, next) => {
    const claims = req.user?.claims || {};
    const roles = claims.roles || claims?.roles;
    // role-check strategies:
    if (Array.isArray(roles) && roles.includes(role)) return next();
    if (claims[role] === true) return next(); // e.g. custom claim `admin: true`
    return res.status(403).json({ error: { message: 'Forbidden', code: 'FORBIDDEN' }});
  };
};

// utils/trackingId.js
const { v4: uuidv4 } = require('uuid');

function generateTrackingId() {
  // e.g. TRK-<short-uuid>
  return 'TRK-' + uuidv4().split('-')[0].toUpperCase();
}

module.exports = generateTrackingId;

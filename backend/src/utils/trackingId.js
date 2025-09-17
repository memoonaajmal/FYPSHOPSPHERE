// src/utils/trackingId.js
const crypto = require('crypto');

let uuidv4Fn = null;

(async () => {
  try {
    const mod = await import('uuid');    
    
    uuidv4Fn = mod.v4;

  } catch (err) {
  }
})();

function generateTrackingId() {

  if (uuidv4Fn) {

    const short = uuidv4Fn().split('-')[0].toUpperCase(); 
    return 'TRK-' + short;
  }

  const shortFallback = crypto.randomBytes(4).toString('hex').toUpperCase();
  return 'TRK-' + shortFallback;
}

module.exports = generateTrackingId;

const mongoose = require('mongoose');
module.exports = function getDBStatus() {
  const states = ['disconnected','connected','connecting','disconnecting','uninitialized'];
  return states[mongoose.connection.readyState] || 'unknown';
};

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: false }, // <-- optional now
  roles: { type: [String], default: ['user'] }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

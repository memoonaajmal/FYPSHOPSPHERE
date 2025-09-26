// backend/src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: false }, // optional (Firebase handles auth)
  roles: { 
    type: [String], 
    default: [] 
  },
  firebaseUid: { type: String,required: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

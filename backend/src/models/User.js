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

  phone: { type: String, default: "" },
  gender: { type: String, enum: ['male', 'female', 'other', 'not_set'], default: 'not_set' },
  birthday: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

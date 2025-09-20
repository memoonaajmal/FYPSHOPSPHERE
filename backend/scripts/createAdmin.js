// scripts/createAdmin.js
const mongoose = require('mongoose');
const User = require('../src/models/User');

require('dotenv').config();

const MONGO_URI = process.env.MONGO_URL + '/' + process.env.DB_NAME;


async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    const existingAdmin = await User.findOne({ roles: 'admin' });
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    const admin = new User({
      email: process.env.ADMIN_EMAIL,
      name: process.env.ADMIN_NAME || 'Admin',
      passwordHash: '', // Firebase handles login
      roles: ['admin'],
    });

    await admin.save();
    console.log('Admin created:', admin.email);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();

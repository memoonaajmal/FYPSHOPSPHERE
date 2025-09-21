// backend/scripts/seedFirebaseSellers.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../src/models/User");
const Store = require("../src/models/Store");
const bcrypt = require("bcrypt");

// Firebase admin
const admin = require("firebase-admin");

dotenv.config();

// Parse Firebase service account from .env
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT not set in .env");
}

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString("utf8")
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME;

if (!MONGO_URL || !DB_NAME) {
  throw new Error("MONGO_URL or DB_NAME not set in .env");
}

async function run() {
  await mongoose.connect(`${MONGO_URL}/${DB_NAME}`);
  console.log("Connected to MongoDB");

  const stores = await Store.find();
  console.log(`Found ${stores.length} stores`);

  for (const store of stores) {
    const email = `${store._id}@example.com`;
    const password = "seller123"; // default password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create MongoDB user if not exists
    let mongoUser = await User.findOne({ email });
    if (!mongoUser) {
      mongoUser = await User.create({
        name: `${store.name} Owner`,
        email,
        passwordHash,
        roles: ["seller"],
      });
      console.log(`Created MongoDB seller: ${email}`);
    } else {
      console.log(`MongoDB seller already exists: ${email}`);
    }

    // Create Firebase user
    try {
      let fbUser;
      try {
        fbUser = await admin.auth().getUserByEmail(email);
        console.log(`Firebase user already exists: ${email}`);
      } catch {
        fbUser = await admin.auth().createUser({
          email,
          password,
          displayName: `${store.name} Owner`,
        });
        console.log(`Created Firebase user: ${email}`);
      }

      // Optional: Set custom claims (role)
      await admin.auth().setCustomUserClaims(fbUser.uid, { role: "seller" });
      console.log(`Set Firebase custom claims for: ${email}`);
    } catch (err) {
      console.error(`Firebase error for ${email}:`, err.message);
    }

    // Link store to MongoDB user
    if (!store.sellerId) {
      store.sellerId = mongoUser._id;
      await store.save();
      console.log(`Linked store ${store._id} to seller ${mongoUser._id}`);
    }
  }

  console.log("Seeding complete!");
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

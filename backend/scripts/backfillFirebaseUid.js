// backend/migration/backfillFirebaseUid.js
require("dotenv").config();
const mongoose = require("mongoose");
const admin = require("../src/utils/firebaseAdmin");
const User = require("../src/models/User");

(async () => {
  try {
    // Build MongoDB URI from .env
    const mongoUri = `${process.env.MONGO_URL}/${process.env.DB_NAME}`;

    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(" Connected to MongoDB");

    // Find users missing firebaseUid
    const users = await User.find({
      $or: [{ firebaseUid: { $exists: false } }, { firebaseUid: "" }],
    });
    console.log(`Found ${users.length} users without firebaseUid`);

    for (const user of users) {
      try {
        //  Lookup Firebase user by email
        const fbUser = await admin.auth().getUserByEmail(user.email);
        if (fbUser) {
          user.firebaseUid = fbUser.uid;
          await user.save();
          console.log(` Patched user ${user.email} with UID ${fbUser.uid}`);
        }
      } catch (err) {
        console.warn(
          ` Could not find Firebase user for ${user.email}: ${err.message}`
        );
      }
    }

    console.log(" Migration completed!");
    process.exit(0);
  } catch (err) {
    console.error(" Migration failed:", err);
    process.exit(1);
  }
})();

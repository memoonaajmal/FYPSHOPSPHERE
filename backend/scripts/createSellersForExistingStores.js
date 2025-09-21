const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../src/models/User");
const Store = require("../src/models/Store");
const bcrypt = require("bcrypt");

dotenv.config();

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

async function run() {
  const MONGO_URL = process.env.MONGO_URL;
  const DB_NAME = process.env.DB_NAME;
  if (!MONGO_URL || !DB_NAME) {
    throw new Error("MONGO_URL or DB_NAME not set in .env");
  }

  await mongoose.connect(`${MONGO_URL}/${DB_NAME}`);
  console.log("Connected to DB");

  const stores = await Store.find();
  console.log(`Found ${stores.length} stores.`);

  let createdCount = 0;
  for (const store of stores) {
    // Generate email/password for seller
    const email = `${store._id}@example.com`;
    const password = "seller123"; // default password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if seller already exists
    let user = await User.findOne({ email });
    if (!user) {
      if (!dryRun) {
        user = await User.create({
          name: store.name + " Owner",
          email,
          passwordHash,
          roles: ["seller"],
        });
      }
      console.log(`Created seller: ${email} with password: ${password}`);
      createdCount++;
    } else {
      console.log(`Seller already exists: ${email}`);
    }

    // Link store to seller
    if (!store.sellerId) {
      if (!dryRun) {
        store.sellerId = user._id;
        await store.save();
      }
      console.log(`Linked store ${store._id} to seller ${user._id}`);
    }
  }

  console.log({ createdSellers: createdCount, totalStores: stores.length });

  await mongoose.disconnect();
  console.log("Disconnected from DB");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

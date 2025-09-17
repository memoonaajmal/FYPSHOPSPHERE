const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const Product = require("../src/models/Product");
const Price = require("../src/models/Price");

const args = process.argv.slice(2);
const drop = args.includes("--drop");
const dryRun = args.includes("--dry-run");
const limitIndex = args.indexOf("--limit");
const limit = limitIndex !== -1 ? Number(args[limitIndex + 1]) : 0;

async function run() {
  const MONGO_URL = process.env.MONGO_URL;
  const DB_NAME = process.env.DB_NAME;
  if (!MONGO_URL || !DB_NAME) {
    throw new Error("MONGO_URL or DB_NAME not set in .env");
  }

  await mongoose.connect(`${MONGO_URL}/${DB_NAME}`);
  console.log("Connected to DB");

  if (drop && !dryRun) {
    await Price.deleteMany({});
    console.log("Dropped prices collection");
  }

  const products = await Product.find({}, { productId: 1 }).lean();
  console.log(`Found ${products.length} products`);

  let inserted = 0;
  const batch = [];
  const BATCH_SIZE = 1000;

  for (const [i, p] of products.entries()) {
    if (limit && inserted >= limit) break;

    const priceValue = Math.floor(Math.random() * (5000 - 500 + 1)) + 500;

    batch.push({
      updateOne: {
        filter: { productId: p.productId },
        update: { $setOnInsert: { productId: p.productId, price: priceValue } },
        upsert: true,
      },
    });

    if (batch.length >= BATCH_SIZE) {
      if (!dryRun) {
        await Price.bulkWrite(batch, { ordered: false }).catch((e) =>
          console.error(e)
        );
      }
      inserted += batch.length;
      batch.length = 0;
    }
  }

  if (batch.length && !dryRun) {
    await Price.bulkWrite(batch, { ordered: false }).catch((e) =>
      console.error(e)
    );
    inserted += batch.length;
  }

  console.log({ inserted });
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

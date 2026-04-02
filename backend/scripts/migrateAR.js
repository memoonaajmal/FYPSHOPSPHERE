// scripts/migrateAR.js  — run once then delete
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Product = require('../src/models/Product');

async function migrate() {
  await mongoose.connect(`${process.env.MONGO_URL}/${process.env.DB_NAME}`);

  // Enable AR for watches and eyewear
  const enableResult = await Product.updateMany(
    {
      $or: [
        { articleType: { $regex: /watch/i } },
        { articleType: { $regex: /glasses|eyewear|sunglasses/i } },
        { subCategory: { $regex: /watches|eyewear|sunglasses/i } },
      ],
    },
    { $set: { isAREnabled: true } }
  );

  // Disable AR for jewellery and bags
  const disableResult = await Product.updateMany(
    {
      $or: [
        { masterCategory: { $regex: /jewellery|jewelry/i } },
        { masterCategory: { $regex: /bags/i } },
        { subCategory:    { $regex: /bags|jewellery|jewelry/i } },
      ],
    },
    { $set: { isAREnabled: false } }
  );

  console.log("AR enabled: ", enableResult.modifiedCount);
  console.log("AR disabled:", disableResult.modifiedCount);

  await mongoose.disconnect();
}

migrate().catch(err => { console.error(err); process.exit(1); });
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Product = require('../src/models/Product');

const args = process.argv.slice(2);
const drop = args.includes('--drop');
const dryRun = args.includes('--dry-run');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? Number(args[limitIndex + 1]) : 0;

async function run() {
  const MONGO_URL = process.env.MONGO_URL;
  const DB_NAME = process.env.DB_NAME;
  if (!MONGO_URL || !DB_NAME) throw new Error('MONGO_URL or DB_NAME not set in .env');
  await mongoose.connect(`${MONGO_URL}/${DB_NAME}`);
  console.log('Connected to DB');
  if (drop && !dryRun) {
    await Product.deleteMany({});
    console.log('Dropped products collection');
  }
  const csvPath = path.resolve(process.env.CSV_PATH || './dataset/styles.csv');
  const imagesDir = path.resolve(process.env.IMAGES_DIR || './public/images');

  let inserted = 0, missingImage = 0, invalid = 0;
  const batch = [];
  const BATCH_SIZE = 1000;

  const stream = fs.createReadStream(csvPath).pipe(csv());
  for await (const row of stream) {
    if (limit && inserted >= limit) break;
    const id = String(row.id || '').trim();
    if (!id) { invalid++; continue; }
    const imageFilename = id + '.jpg';
    const imagePath = path.join(imagesDir, imageFilename);
    const hasImage = fs.existsSync(imagePath);
    if (!hasImage) missingImage++;
    const doc = {
      productId: id,
      gender: row.gender || undefined,
      masterCategory: row.masterCategory || undefined,
      subCategory: row.subCategory || undefined,
      articleType: row.articleType || undefined,
      baseColour: row.baseColour || undefined,
      season: row.season || undefined,
      year: row.year ? Number(row.year) : undefined,
      usage: row.usage || undefined,
      productDisplayName: row.productDisplayName || undefined,
      imageFilename: hasImage ? imageFilename : undefined
    };
    batch.push({ updateOne: { filter: { productId: doc.productId }, update: { $setOnInsert: doc }, upsert: true } });
    if (batch.length >= BATCH_SIZE) {
      if (!dryRun) await Product.bulkWrite(batch, { ordered: false }).catch(e => console.error(e));
      inserted += batch.length;
      batch.length = 0;
    }
  }
  if (batch.length && !dryRun) {
    await Product.bulkWrite(batch, { ordered: false }).catch(e => console.error(e));
    inserted += batch.length;
  }
  console.log({ inserted, missingImage, invalid });
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });

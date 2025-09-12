// scripts/buildStores.js
import mongoose from "mongoose";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

/*
  Robust loader: try require() for CommonJS product model and dynamic import() for Store (ESM).
  It will also attempt multiple file paths for models to fit different project layouts.
*/

function tryRequire(paths) {
  for (const p of paths) {
    try {
      const mod = require(p);
      console.log(`Loaded module via require: ${p}`);
      return mod;
    } catch (err) {
      // ignore
    }
  }
  throw new Error("Could not require any of: " + paths.join(", "));
}

async function tryImport(paths) {
  for (const p of paths) {
    try {
      const mod = await import(p);
      console.log(`Loaded module via import: ${p}`);
      return mod.default || mod;
    } catch (err) {
      // ignore
    }
  }
  throw new Error("Could not import any of: " + paths.join(", "));
}

async function loadModels() {
  // Try to load Product (CommonJS in your code)
  const productPaths = [
    "../src/models/Product.js",
    "../models/Product.js",
    "./src/models/Product.js",
    "./models/Product.js"
  ];
  let Product;
  try {
    Product = tryRequire(productPaths);
    // If the module has .default (ESM interop), use it
    if (Product && Product.default) Product = Product.default;
  } catch (e) {
    // fallback to dynamic import if require fails
    console.warn("require() failed for Product. Trying dynamic import...");
    Product = await tryImport(productPaths);
  }

  // Load Store (attempt import first)
  const storePaths = [
    "../models/Store.js",
    "../src/models/Store.js",
    "./models/Store.js",
    "./src/models/Store.js"
  ];
  let Store;
  try {
    Store = await tryImport(storePaths);
  } catch (e) {
    console.warn("dynamic import failed for Store, trying require() as fallback...");
    Store = tryRequire(storePaths);
    if (Store && Store.default) Store = Store.default;
  }

  return { Product, Store };
}

async function tryConnectToAny(baseUri) {
  // If user provided a full MONGODB_URI, try that first
  const candidates = [];
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
    candidates.push(process.env.MONGODB_URI.trim());
  }

  // Basic baseUri (no DB) and likely DB names
  const base = baseUri.replace(/\/+$/, ""); // remove trailing slash
  const dbNames = ["shopsphere", "fashion", "test", "admin"];
  for (const name of dbNames) candidates.push(`${base}/${name}`);

  // Finally try base (no db) — mongoose will default to 'test'
  candidates.push(base);

  for (const uri of candidates) {
    try {
      // ensure disconnected first
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await mongoose.connect(uri, {
        // useUnifiedTopology/useNewUrlParser not required in modern mongoose, but harmless
      });
      console.log(`Connected to ${uri}`);
      return uri; // success
    } catch (err) {
      console.warn(`Connect failed for ${uri}: ${err.message}`);
      try { await mongoose.disconnect(); } catch (_) {}
    }
  }
  throw new Error("Unable to connect to any candidate MongoDB URIs.");
}

async function buildStores() {
  // Adjust this base if you keep Mongo at another host:port
  const baseMongo = process.env.MONGO_BASE_URI || "mongodb://localhost:27017";

  const { Product, Store } = await loadModels();

  // Attempt connections until we find one
  let usedUri;
  try {
    usedUri = await tryConnectToAny(baseMongo);
  } catch (err) {
    console.error("Could not connect to MongoDB. Set MONGODB_URI or check local Mongo.");
    console.error(err);
    process.exit(1);
  }

  // Quick sanity: does `Product` look like a Mongoose model?
  if (!Product || typeof Product.find !== "function") {
    console.error("Loaded Product module doesn't look like a Mongoose model. Aborting.");
    process.exit(1);
  }

  // Debug: count products in DB
  const totalProducts = await Product.countDocuments().catch(() => 0);
  console.log("Total products (Product.countDocuments):", totalProducts);

  if (!totalProducts || totalProducts === 0) {
    console.error("No products found in the connected DB. Check that you're connected to the correct database.");
    console.error("If your data is in a different DB (e.g. 'shopsphere'), set MONGODB_URI to mongodb://host:port/shopsphere and rerun.");
    await mongoose.disconnect();
    process.exit(1);
  }

  // Confirm subCategory distinct values (useful debug)
  const distinctCats = await Product.distinct("subCategory").catch(() => []);
  console.log("Distinct subCategory values found:", distinctCats);

  // Map stores -> categories (match your DB values exactly)
  const storeMapping = {
    store_watch: { name: "Watch Store", categories: ["Watches"] },
    store_bag: { name: "Bag Store", categories: ["Bags"] },
    store_jewellery: { name: "Jewellery Store", categories: ["Jewellery"] },
    store_eyewear: { name: "Eyewear Store", categories: ["Eyewear"] }
  };

  // For each store, find productIds and upsert store doc
  for (const [storeId, storeInfo] of Object.entries(storeMapping)) {
    console.log(`\n--- Processing ${storeInfo.name} (${storeId}) ---`);
    console.log("Searching for categories:", storeInfo.categories);

    // Use case-insensitive exact match for safety
    const regexes = storeInfo.categories.map(c => new RegExp(`^${c}$`, "i"));

    const products = await Product.find({
      subCategory: { $in: regexes }
    }).select("productId").lean();

    console.log(`Found ${products.length} products matching ${storeInfo.categories.join(", ")}`);

    if (products.length > 0) {
      // show a small sample
      console.log("Sample productIds:", products.slice(0, 6).map(p => p.productId));
    } else {
      console.log("No products matched — check subCategory values above and storeMapping.");
    }

    const productIds = products.map(p => String(p.productId));

    // Upsert into stores collection (create/replace productIds)
    await Store.findOneAndUpdate(
      { _id: storeId },
      {
        _id: storeId,
        name: storeInfo.name,
        categories: storeInfo.categories,
        productIds
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`✅ ${storeInfo.name} updated with ${productIds.length} productIds`);
  }

  // Final summary
  const storeDocs = await Store.find({}).select("_id name productIds").lean();
  console.log("\nStores in DB (summary):");
  for (const s of storeDocs) {
    console.log(s._id, "-", s.name, "→ productIds:", (s.productIds || []).length);
  }

  await mongoose.disconnect();
  console.log("🔌 Disconnected from MongoDB (done).");
}

// run
buildStores().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

// scripts/buildStores.js
const mongoose = require("mongoose");
const path = require("path");

/*
  Robust loader: try require() for Product and Store models.
  Works with different project layouts.
*/

function tryRequire(paths) {
  for (const p of paths) {
    try {
      const mod = require(p);
      console.log(`Loaded module via require: ${p}`);
      return mod.default || mod; // handle ESM interop
    } catch (err) {
      // ignore
    }
  }
  throw new Error("Could not require any of: " + paths.join(", "));
}

async function loadModels() {
  // Product model (CJS in your project)
  const productPaths = [
    path.join(__dirname, "../src/models/Product.js"),
    path.join(__dirname, "../models/Product.js"),
    path.join(__dirname, "./src/models/Product.js"),
    path.join(__dirname, "./models/Product.js")
  ];
  const Product = tryRequire(productPaths);

  // Store model
  const storePaths = [
    path.join(__dirname, "../src/models/Store.js"),
    path.join(__dirname, "../models/Store.js"),
    path.join(__dirname, "./src/models/Store.js"),
    path.join(__dirname, "./models/Store.js")
  ];
  const Store = tryRequire(storePaths);

  return { Product, Store };
}

async function tryConnectToAny(baseUri) {
  const candidates = [];
  if (process.env.MONGODB_URI && process.env.MONGODB_URI.trim()) {
    candidates.push(process.env.MONGODB_URI.trim());
  }

  const base = baseUri.replace(/\/+$/, ""); // remove trailing slash
  const dbNames = ["shopsphere", "fashion", "test", "admin"];
  for (const name of dbNames) candidates.push(`${base}/${name}`);
  candidates.push(base);

  for (const uri of candidates) {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      await mongoose.connect(uri);
      console.log(`Connected to ${uri}`);
      return uri;
    } catch (err) {
      console.warn(`Connect failed for ${uri}: ${err.message}`);
      try { await mongoose.disconnect(); } catch (_) {}
    }
  }
  throw new Error("Unable to connect to any candidate MongoDB URIs.");
}

async function buildStores() {
  const baseMongo = process.env.MONGO_BASE_URI || "mongodb://localhost:27017";

  const { Product, Store } = await loadModels();

  let usedUri;
  try {
    usedUri = await tryConnectToAny(baseMongo);
  } catch (err) {
    console.error("Could not connect to MongoDB. Set MONGODB_URI or check local Mongo.");
    console.error(err);
    process.exit(1);
  }

  if (!Product || typeof Product.find !== "function") {
    console.error("Loaded Product module doesn't look like a Mongoose model. Aborting.");
    process.exit(1);
  }

  const totalProducts = await Product.countDocuments().catch(() => 0);
  console.log("Total products (Product.countDocuments):", totalProducts);

  if (!totalProducts || totalProducts === 0) {
    console.error("No products found in the connected DB. Check that you're connected to the correct database.");
    console.error("If your data is in a different DB (e.g. 'shopsphere'), set MONGODB_URI to mongodb://host:port/shopsphere and rerun.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const distinctCats = await Product.distinct("subCategory").catch(() => []);
  console.log("Distinct subCategory values found:", distinctCats);

  const storeMapping = {
    store_watch: { name: "Watch Store", categories: ["Watches"] },
    store_bag: { name: "Bag Store", categories: ["Bags"] },
    store_jewellery: { name: "Jewellery Store", categories: ["Jewellery"] },
    store_eyewear: { name: "Eyewear Store", categories: ["Eyewear"] }
  };

  for (const [storeId, storeInfo] of Object.entries(storeMapping)) {
    console.log(`\n--- Processing ${storeInfo.name} (${storeId}) ---`);
    console.log("Searching for categories:", storeInfo.categories);

    const regexes = storeInfo.categories.map(c => new RegExp(`^${c}$`, "i"));

    const products = await Product.find({
      subCategory: { $in: regexes }
    }).select("productId").lean();

    console.log(`Found ${products.length} products matching ${storeInfo.categories.join(", ")}`);

    if (products.length > 0) {
      console.log("Sample productIds:", products.slice(0, 6).map(p => p.productId));
    } else {
      console.log("No products matched — check subCategory values above and storeMapping.");
    }

    const productIds = products.map(p => String(p.productId));

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

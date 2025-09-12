const Store = require("../models/Store");
const Product = require("../models/Product");

// ✅ Get all stores
exports.getStores = async (req, res) => {
  try {
    console.log("👉 Hitting GET /api/stores");

    const stores = await Store.find({});
    console.log("✅ Stores found:", stores);

    res.json(stores);
  } catch (err) {
    console.error("❌ Error in GET /api/stores:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get single store with products
exports.getStoreWithProducts = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const products = await Product.find({
      productId: { $in: store.productIds },
    });

    const productsWithImage = products.map((p) => ({
      ...p.toObject(),
      imageUrl: `${req.protocol}://${req.get("host")}/images/${p.imageFilename}`,
    }));

    res.json({ store, products: productsWithImage });
  } catch (err) {
    console.error("❌ Error in GET /api/stores/:id:", err);
    res.status(500).json({ message: err.message });
  }
};

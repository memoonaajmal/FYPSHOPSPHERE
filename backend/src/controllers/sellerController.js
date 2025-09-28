// backend/src/controllers/sellerController.js
const Product = require("../models/Product");
const Store = require("../models/Store");
const Order = require("../models/Order");
const Price = require("../models/Price"); // <-- imported Price model
const mongoose = require("mongoose");

/**
 * Helper: generate a unique productId string (fits your Product.productId)
 */
function generateProductId() {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Resolve store for the logged-in seller by sellerId
 */
async function getStoreForSeller(req) {
  if (!req.user?.mongoUser?._id) return null;
  const store = await Store.findOne({ sellerId: req.user.mongoUser._id });
  return store;
}

/**
 * Add a new product for the logged-in seller/store
 */
exports.addProduct = async (req, res) => {
  try {
    const store = await getStoreForSeller(req);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const {
      productDisplayName,
      gender,
      masterCategory,
      subCategory,
      articleType,
      baseColour,
      season,
      year,
      usage,
      imageFilename,
      price, // optional: allow setting price at creation
    } = req.body;

    const productId = generateProductId();

    const product = new Product({
      productId,
      productDisplayName: productDisplayName || "Untitled Product",
      gender,
      masterCategory,
      subCategory,
      articleType,
      baseColour,
      season,
      year,
      usage,
      imageFilename,
    });

    await product.save();

    // Save price if provided
    if (price != null) {
      const priceDoc = new Price({ productId, price });
      await priceDoc.save();
    }

    store.productIds.push(productId);
    await store.save();

    res.status(201).json(product);
  } catch (err) {
    console.error("Error addProduct:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all products for logged-in seller/store with price
 */
exports.getMyProducts = async (req, res) => {
  try {
    const store = await getStoreForSeller(req);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const products = await Product.find({ productId: { $in: store.productIds } });

    // fetch prices for all products
    const productIds = products.map(p => p.productId);
    const prices = await Price.find({ productId: { $in: productIds } });

    // map prices to products
    const productsWithPrice = products.map(p => {
      const priceDoc = prices.find(pr => pr.productId === p.productId);
      return {
        ...p.toObject(),
        price: priceDoc ? priceDoc.price : 0,
      };
    });

    res.json(productsWithPrice);
  } catch (err) {
    console.error("Error getMyProducts:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update a product (only if it belongs to this store)
 */
exports.updateProduct = async (req, res) => {
  try {
    const store = await getStoreForSeller(req);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const { id } = req.params; // productId
    const updates = req.body;

    if (!store.productIds.includes(id)) {
      return res.status(404).json({ message: "Product not found or not owned by this store" });
    }

    const product = await Product.findOneAndUpdate({ productId: id }, updates, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // If price is updated
    if (updates.price != null) {
      await Price.findOneAndUpdate(
        { productId: id },
        { price: updates.price },
        { upsert: true, new: true }
      );
    }

    res.json(product);
  } catch (err) {
    console.error("Error updateProduct:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Delete a product (only if it belongs to this store)
 */
exports.deleteProduct = async (req, res) => {
  try {
    const store = await getStoreForSeller(req);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const { id } = req.params; // productId

    if (!store.productIds.includes(id)) {
      return res.status(404).json({ message: "Product not found or not owned by this store" });
    }

    const product = await Product.findOneAndDelete({ productId: id });
    if (!product) return res.status(404).json({ message: "Product not found" });

    // remove productId from store.productIds
    store.productIds = store.productIds.filter(pid => pid !== id);
    await store.save();

    // delete price as well
    await Price.findOneAndDelete({ productId: id });

    res.json({ message: "Product deleted successfully", product });
  } catch (err) {
    console.error("Error deleteProduct:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get orders that include this store's products
 */
/**
 * Get orders (filtered, paginated) that include this store's products
 */
exports.getMyOrders = async (req, res) => {
  try {
    const store = await getStoreForSeller(req);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const productIds = store.productIds.map(String);

    // ✅ Extract filters from query
    const {
      page = 1,
      limit = 5,
      search = "",
      status = "",
      from = "",
      to = "",
    } = req.query;

    const pageNum = parseInt(page);
    const perPage = parseInt(limit);

    // ✅ Build base query
    const baseQuery = {
      "items.productId": { $in: productIds },
    };

    // 🔍 Search filter (name, email, phone, trackingId)
    if (search) {
      baseQuery.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { trackingId: { $regex: search, $options: "i" } },
      ];
    }

    // 📦 Payment status filter
    if (status) {
      baseQuery.paymentStatus = status;
    }

    // 📅 Date range filter
    if (from || to) {
      baseQuery.createdAt = {};
      if (from) baseQuery.createdAt.$gte = new Date(from);
      if (to) {
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        baseQuery.createdAt.$lte = endOfDay;
      }
    }

    // ✅ Count total matching docs
    const totalOrders = await Order.countDocuments(baseQuery);
    const totalPages = Math.ceil(totalOrders / perPage);

    // ✅ Query with pagination + sorting
    const ordersRaw = await Order.find(baseQuery)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * perPage)
      .limit(perPage);

    // ✅ Filter items per seller
    const orders = ordersRaw.map((order) => {
      const sellerItems = order.items.filter((item) =>
        productIds.includes(item.productId)
      );
      const itemsTotal = sellerItems.reduce(
        (sum, it) => sum + (it.price * it.quantity || 0),
        0
      );
      return {
        _id: order._id,
        user: order.user,
        firstName: order.firstName,
        lastName: order.lastName,
        phone: order.phone,
        email: order.email,
        houseAddress: order.houseAddress,
        items: sellerItems,
        itemsTotal,
        shippingFee: order.shippingFee,
        grandTotal: order.grandTotal,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        trackingId: order.trackingId,
        createdAt: order.createdAt,
      };
    });

    // ✅ Respond with paginated format
    res.json({
      orders,
      totalPages,
      currentPage: pageNum,
    });
  } catch (err) {
    console.error("Error getMyOrders:", err);
    res.status(500).json({ message: err.message });
  }
};



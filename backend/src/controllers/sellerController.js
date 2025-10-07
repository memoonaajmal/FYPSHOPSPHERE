const Product = require("../models/Product");
const Store = require("../models/Store");
const Order = require("../models/Order");
const Price = require("../models/Price");
const mongoose = require("mongoose");

/**
 * Helper: generate a unique productId string
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
 * Add a new product
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
      price,
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
 * Get all products for this seller/store
 */
exports.getMyProducts = async (req, res) => {
  try {
    const store = await getStoreForSeller(req);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const products = await Product.find({ productId: { $in: store.productIds } });
    const productIds = products.map(p => p.productId);
    const prices = await Price.find({ productId: { $in: productIds } });

    const productsWithPrice = products.map(p => {
      const priceDoc = prices.find(pr => pr.productId === p.productId);
      return { ...p.toObject(), price: priceDoc ? priceDoc.price : 0 };
    });

    res.json(productsWithPrice);
  } catch (err) {
    console.error("Error getMyProducts:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update product
 */
exports.updateProduct = async (req, res) => {
  try {
    const store = await getStoreForSeller(req);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const { id } = req.params;
    const updates = req.body;

    if (!store.productIds.includes(id)) {
      return res.status(404).json({ message: "Product not found or not owned by this store" });
    }

    const product = await Product.findOneAndUpdate({ productId: id }, updates, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });

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
 * Delete product
 */
exports.deleteProduct = async (req, res) => {
  try {
    const store = await getStoreForSeller(req);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const { id } = req.params;

    if (!store.productIds.includes(id)) {
      return res.status(404).json({ message: "Product not found or not owned by this store" });
    }

    const product = await Product.findOneAndDelete({ productId: id });
    if (!product) return res.status(404).json({ message: "Product not found" });

    store.productIds = store.productIds.filter(pid => pid !== id);
    await store.save();

    await Price.findOneAndDelete({ productId: id });

    res.json({ message: "Product deleted successfully", product });
  } catch (err) {
    console.error("Error deleteProduct:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * ✅ Get all orders with seller-specific payment info
 */
exports.getMyOrders = async (req, res) => {
  try {
    const store = await getStoreForSeller(req);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const productIds = store.productIds.map(String);

    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      from = "",
      to = "",
    } = req.query;

    const pageNum = parseInt(page);
    const perPage = parseInt(limit);

    const baseQuery = { "items.productId": { $in: productIds } };

    if (search) {
      baseQuery.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { trackingId: { $regex: search, $options: "i" } },
      ];
    }

    if (status) baseQuery.paymentStatus = status;

    if (from || to) {
      baseQuery.createdAt = {};
      if (from) baseQuery.createdAt.$gte = new Date(from);
      if (to) {
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        baseQuery.createdAt.$lte = endOfDay;
      }
    }

    const totalOrders = await Order.countDocuments(baseQuery);
    const totalPages = Math.ceil(totalOrders / perPage);

    const ordersRaw = await Order.find(baseQuery)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * perPage)
      .limit(perPage)
      .lean();

    const orders = ordersRaw.map(order => {
      const sellerItems = order.items.filter(item => productIds.includes(item.productId));
      const myPaymentStatus = sellerItems.every(i => i.itemPaymentStatus === "paid" || i.itemPaymentStatus === "returned")
        ? sellerItems[0].itemPaymentStatus
        : "pending";

      const itemsTotal = sellerItems.reduce(
        (sum, it) => sum + (it.price * it.quantity || 0),
        0
      );

      return {
        ...order,
        items: sellerItems,
        itemsTotal,
        myPaymentStatus, 
      };
    });

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

/**
 * ✅ Mark this seller's items as paid OR returned
 */
exports.updateItemStatus = async (req, res) => {
  try {
    const store = await getStoreForSeller(req);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const { orderId } = req.params;
    const { status } = req.body; // "paid" or "returned"

    if (!["paid", "returned"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    let updated = false;
    order.items.forEach(item => {
      if (item.storeId.toString() === store._id.toString()) {
        if (item.itemPaymentStatus !== status) {
          item.itemPaymentStatus = status;
          updated = true;
        }
      }
    });

    if (!updated) {
      return res.status(400).json({ message: "No items to update or already marked" });
    }

    const allSame = order.items.every(it => it.itemPaymentStatus === status);
    if (allSame) {
      order.paymentStatus = status;
    }

    await order.save();

    return res.json({
      message: `Items marked as ${status}`,
      myPaymentStatus: status,
      paymentStatus: order.paymentStatus,
      order,
    });
  } catch (err) {
    console.error("updateItemStatus error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * ✅ Get single order details for this seller
 */
exports.getOrderById = async (req, res) => {
  try {
    const store = await getStoreForSeller(req);
    if (!store) return res.status(404).json({ message: "Store not found" });

    const { orderId } = req.params;
    const order = await Order.findById(orderId).lean();
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Only include this seller’s items
    const sellerItems = order.items.filter(
      (item) => item.storeId?.toString() === store._id.toString()
    );

    const myPaymentStatus = sellerItems.every(
      (it) => it.itemPaymentStatus === "paid" || it.itemPaymentStatus === "returned"
    )
      ? sellerItems[0].itemPaymentStatus
      : "pending";

    const itemsTotal = sellerItems.reduce(
      (sum, it) => sum + (it.price * it.quantity || 0),
      0
    );

    return res.json({
      ...order,
      items: sellerItems,
      myPaymentStatus,
      itemsTotal,
    });
  } catch (err) {
    console.error("getOrderById error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

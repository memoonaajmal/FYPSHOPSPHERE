// backend/src/controllers/analyticsController.js
const Order = require("../models/Order");
const Store = require("../models/Store");
const Product = require("../models/Product");
const Price = require("../models/Price");

exports.getDashboardAnalytics = async (req, res) => {
  try {
    const sellerId = req.user?.id;
    if (!sellerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 1️⃣ Find stores belonging to this seller
    const stores = await Store.find({ sellerId });
    const storeIds = stores.map((s) => s._id);

    // 2️⃣ Collect all productIds from seller's stores
    const sellerProductIds = stores.flatMap((s) => s.productIds);

    // 3️⃣ Get prices for those products
    const prices = await Price.find({ productId: { $in: sellerProductIds } });
    const priceMap = {};
    prices.forEach((p) => {
      priceMap[p.productId] = p.price;
    });

    // 4️⃣ Get all orders that include items from seller's stores
    const allOrders = await Order.find({
      "items.storeId": { $in: storeIds },
    });

    let totalRevenue = 0;
    let totalOrders = 0;
    let pendingOrders = 0;
    let deliveredOrders = 0;
    let cancelledOrders = 0;

    const productSales = {}; // for bestseller tracking

    // 5️⃣ Calculate revenue and stats
    for (const order of allOrders) {
      let sellerHasItem = false;

      for (const item of order.items) {
        if (storeIds.includes(item.storeId)) {
          sellerHasItem = true;

          // Count sales for top products
          productSales[item.productId] =
            (productSales[item.productId] || 0) + item.quantity;

          // ✅ Use Price model for revenue
          const productPrice = priceMap[item.productId] || 0;
          if (order.paymentStatus === "paid") {
            totalRevenue += productPrice * item.quantity;
          }
        }
      }

      if (sellerHasItem) {
        totalOrders++;
        if (order.paymentStatus === "pending") pendingOrders++;
        if (order.paymentStatus === "paid") deliveredOrders++;
        if (order.paymentStatus === "returned") cancelledOrders++;
      }
    }

    // 6️⃣ Compute top 5 bestsellers
    const topProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topProductsWithDetails = await Promise.all(
  topProducts.map(async ([productId, sold]) => {
    const product = await Product.findOne({ productId });
    return {
      product, // send full product object
      sold,
    };
  })
);


    res.json({
      totalRevenue,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      topProducts: topProductsWithDetails,
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// 📊 GET /api/analytics/sales?range=daily|weekly|monthly
exports.getSalesAnalytics = async (req, res) => {
  try {
    const sellerId = req.user?.id;
    if (!sellerId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const range = req.query.range || "weekly"; // default: weekly

    // 1️⃣ Find seller's stores
    const stores = await Store.find({ sellerId });
    const storeIds = stores.map((s) => s._id);

    // 2️⃣ Define date filter based on range
    const now = new Date();
    let startDate;

    if (range === "daily") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === "weekly") {
      const day = now.getDay(); // 0 = Sunday
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "monthly") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 3️⃣ Get orders since startDate
    const orders = await Order.find({
      "items.storeId": { $in: storeIds },
      paymentStatus: "paid",
      createdAt: { $gte: startDate },
    });

    // 4️⃣ Create a map based on range
    const salesMap = {};

    orders.forEach((order) => {
      let key;
      const date = new Date(order.createdAt);

      if (range === "daily") {
        key = date.toLocaleTimeString("en-US", { hour: "2-digit" });
      } else if (range === "weekly") {
        key = date.toLocaleDateString("en-US", { weekday: "short" }); // Mon, Tue
      } else if (range === "monthly") {
        key = date.toLocaleDateString("en-US", { day: "2-digit" }); // 01, 02, 03...
      }

      let orderTotal = 0;
      for (const item of order.items) {
        if (storeIds.includes(item.storeId)) {
          orderTotal += item.price * item.quantity;
        }
      }

      salesMap[key] = (salesMap[key] || 0) + orderTotal;
    });

    // 5️⃣ Build chart data in correct order
    let labels = [];
    if (range === "daily") {
      labels = Array.from({ length: 24 }, (_, i) =>
        new Date(0, 0, 0, i).toLocaleTimeString("en-US", { hour: "2-digit" })
      );
    } else if (range === "weekly") {
      labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    } else if (range === "monthly") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      labels = Array.from({ length: daysInMonth }, (_, i) =>
        (i + 1).toString().padStart(2, "0")
      );
    }

    const sales = labels.map((label) => ({
      name: label,
      value: salesMap[label] || 0,
    }));

    res.json({ sales });
  } catch (err) {
    console.error("Sales analytics error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


// 📊 GET /api/analytics/top-customers
exports.getTopCustomers = async (req, res) => {
  try {
    const sellerId = req.user?.id;
    if (!sellerId) return res.status(401).json({ error: "Unauthorized" });

    // Find all stores belonging to this seller
    const stores = await Store.find({ sellerId });
    const storeIds = stores.map((store) => store._id.toString());
    if (!storeIds.length) return res.json({ topCustomers: [] });

    // Find all paid orders that include products from these stores
    const orders = await Order.find({
      "items.storeId": { $in: storeIds },
      paymentStatus: "paid",
    }).populate("user", "name email");

    console.log("Fetched orders:", orders.length);

    // Calculate per-customer totals
    const customerStats = {};

    orders.forEach((order) => {
      const user = order.user;
      if (!user) return;

      let orderTotal = 0;
      order.items.forEach((item) => {
        if (storeIds.includes(item.storeId)) {
          orderTotal += item.price * item.quantity;
        }
      });

      if (!customerStats[user._id]) {
        customerStats[user._id] = { user, totalSpent: 0, totalOrders: 0 };
      }

      customerStats[user._id].totalSpent += orderTotal;
      customerStats[user._id].totalOrders += 1;
    });

    const topCustomers = Object.values(customerStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    console.log("Top customers:", topCustomers);

    res.json({ topCustomers });
  } catch (err) {
    console.error("Top customers error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 📊 GET /api/analytics/customer-summary
exports.getCustomerSummary = async (req, res) => {
  try {
    const sellerId = req.user?.id;
    if (!sellerId) return res.status(401).json({ error: "Unauthorized" });

    const stores = await Store.find({ sellerId });
    const storeIds = stores.map((s) => s._id);

    const orders = await Order.find({
      "items.storeId": { $in: storeIds },
      paymentStatus: "paid",
    }).populate("user", "name email");

    if (!orders.length) return res.json({ summary: null });

    const customerData = {};
    let totalRevenue = 0;

    orders.forEach((order) => {
      const user = order.user;
      if (!user) return;

      let orderTotal = 0;
      order.items.forEach((item) => {
        if (storeIds.includes(item.storeId)) {
          orderTotal += item.price * item.quantity;
        }
      });

      totalRevenue += orderTotal;

      if (!customerData[user._id]) {
        customerData[user._id] = { user, orders: 0, totalSpent: 0 };
      }
      customerData[user._id].orders += 1;
      customerData[user._id].totalSpent += orderTotal;
    });

    const uniqueCustomers = Object.keys(customerData).length;
    const repeatCustomers = Object.values(customerData).filter(
      (c) => c.orders > 1
    ).length;
    const avgOrderValue = (totalRevenue / orders.length).toFixed(2);

    const mostActive = Object.values(customerData).sort(
      (a, b) => b.orders - a.orders
    )[0];

    res.json({
      summary: {
        uniqueCustomers,
        repeatCustomers,
        avgOrderValue,
        mostActive: mostActive?.user?.name || "N/A",
      },
    });
  } catch (err) {
    console.error("Customer summary error:", err);
    res.status(500).json({ error: "Server error" });
  }
};


const User = require("../models/User");
const Order = require("../models/Order");
const Store = require("../models/Store");
;

// USERS

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-passwordHash");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching users",
      error: err.message,
    });
  }
};




exports.getStoreOrdersForAdmin = async (req, res) => {
  try {
    const { sellerId, page = 1, limit = 10 } = req.query;
    if (!sellerId)
      return res.status(400).json({ message: "sellerId query param is required" });

    const store = await Store.findOne({ sellerId }).lean();
    if (!store) return res.status(404).json({ message: "Store not found" });

    const productIds = store.productIds.map(String);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const totalOrders = await Order.countDocuments({
      "items.productId": { $in: productIds },
    });

    const orders = await Order.find({ "items.productId": { $in: productIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const filteredOrders = orders.map((order) => {
      const sellerItems = order.items.filter((item) =>
        productIds.includes(item.productId)
      );
      const itemsTotal = sellerItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      return {
        ...order.toObject(),
        items: sellerItems,
        itemsTotal,
      };
    });

    res.status(200).json({
      orders: filteredOrders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error("Error in getStoreOrdersForAdmin:", err);
    res.status(500).json({ message: err.message });
  }
};

//  ANALYTICS / DASHBOARD DATA

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

exports.getAnalytics = async (req, res) => {
  try {
    //  Total Sales
    const totalSalesAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const totalSales = totalSalesAgg[0]?.total || 0;

    //  Total Users
    const totalUsers = await User.countDocuments();

    //  Active Stores (with products)
    const activeStores = await Store.countDocuments({
      productIds: { $exists: true, $ne: [] },
    });

    //  Pending Orders
    const pendingOrders = await Order.countDocuments({
      paymentStatus: "pending",
    });

    //  Monthly Sales (last 12 months)
    const salesByMonth = await Order.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          total: { $sum: "$grandTotal" },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const salesData = monthNames.map((month, i) => {
      const match = salesByMonth.find((s) => s._id === i + 1);
      return { month, sales: match ? match.total : 0 };
    });

    //  Store-wise Sales (Top 5)
    const storeSales = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.storeId",
          total: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      totalSales,
      totalUsers,
      activeStores,
      pendingOrders,
      salesData,
      storeSales,
    });
  } catch (err) {
    console.error("Error in getAnalytics:", err);
    res.status(500).json({ message: "Failed to load analytics", error: err.message });
  }
};

exports.getAllStoresWithStats = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; 
    const skip = (page - 1) * limit;

    //  Count total stores for pagination
    const totalStores = await Store.countDocuments();

    //  Get paginated stores
    const stores = await Store.find().skip(skip).limit(limit).lean();

    //  Add stats for each store (orders + sales)
    const storesWithStats = await Promise.all(
      stores.map(async (store) => {
        // Fetch all orders containing this store's products
        const orders = await Order.find({
          "items.storeId": store._id,
        }).select("items");

        let totalSales = 0;
        let totalOrders = orders.length;

        // Calculate total sales
        orders.forEach((order) => {
          order.items.forEach((item) => {
            if (item.storeId === store._id) {
              totalSales += item.price * item.quantity;
            }
          });
        });

        return {
          ...store,
          totalOrders,
          totalSales,
        };
      })
    );

    //  Send paginated result
    res.status(200).json({
      stores: storesWithStats,
      totalPages: Math.ceil(totalStores / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error(" Error fetching stores with stats:", err);
    res.status(500).json({
      message: "Failed to load stores with stats",
      error: err.message,
    });
  }
};

//  Fetch recently placed orders (sorted by creation time)
exports.getRecentOrders = async (req, res) => {
  try {
    const orders = await Order.findOne()
      .sort({ createdAt: -1 }) // latest first
      .limit(3) 
      .select("firstName lastName email grandTotal paymentStatus createdAt");

    res.status(200).json({ orders });
  } catch (error) {
    console.error(" Error fetching recent orders:", error);
    res.status(500).json({ message: "Failed to fetch recent orders" });
  }
};
//  Get the most recently created stores

const Product = require("../models/Product");
const Price = require("../models/Price");
const Order = require("../models/Order");
const cosineSim = require("../utils/similarity");

exports.getRecommendations = async (req, res) => {
  try {
    console.log("🔹 Authenticated user:", req.user);

    //Get user orders if user is provided
    let purchasedIds = new Set();

    if (req.user?.id) {
      // use MongoDB ObjectId
      const orders = await Order.find({ user: req.user.id }).lean();
      console.log(`🔹 Found ${orders.length} orders for user`);

      orders.forEach((order) => {
        order.items.forEach((item) =>
          purchasedIds.add(item.productId.toString()),
        );
      });
    }

    console.log("Purchased IDs:", Array.from(purchasedIds));

    let recommendations = [];

    if (purchasedIds.size > 0) {
      //Get purchased products embeddings
      const purchasedProducts = await Product.find({
        productId: { $in: Array.from(purchasedIds) },
        embedding: { $exists: true, $ne: [] },
      }).lean();

      console.log(
        `🔹 Purchased products with embeddings: ${purchasedProducts.length}`,
      );

      if (purchasedProducts.length > 0) {
        //Compute average embedding
        const avgEmbedding = new Array(
          purchasedProducts[0].embedding.length,
        ).fill(0);
        purchasedProducts.forEach((p) => {
          p.embedding.forEach((val, i) => (avgEmbedding[i] += val));
        });
        for (let i = 0; i < avgEmbedding.length; i++) {
          avgEmbedding[i] /= purchasedProducts.length;
        }
        console.log(
          "🔹 Computed average embedding:",
          avgEmbedding.slice(0, 5),
          "...",
        );

        //Get all other products
        const allProducts = await Product.find({
          productId: { $nin: Array.from(purchasedIds) },
          embedding: { $exists: true, $ne: [] },
        }).lean();

        console.log(
          `🔹 Found ${allProducts.length} other products with embeddings`,
        );

        if (allProducts.length > 0) {
          //compute similarity and pick top 10
          const rankedProducts = allProducts
            .map((p) => ({
              product: p,
              score: cosineSim(avgEmbedding, p.embedding),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

          console.log(
            `🔹 Top 10 ranked products:`,
            rankedProducts.map((p) => ({
              id: p.product.productId,
              score: p.score.toFixed(3),
            })),
          );

          //Attach prices
          recommendations = await Promise.all(
            rankedProducts.map(async (item) => {
              const priceDoc = await Price.findOne({
                productId: item.product.productId,
              }).lean();
              return {
                ...item.product,
                price: priceDoc?.price || 0,
                score: item.score,
              };
            }),
          );
        }
      }
    }

    //Fallback: show popular/random products if no recommendations
    if (recommendations.length === 0) {
      console.log(
        "⚠️ No order history or embeddings, returning fallback products",
      );

      const fallbackProducts = await Product.find({
        embedding: { $exists: true, $ne: [] },
      })
        .limit(10)
        .lean();

      recommendations = await Promise.all(
        fallbackProducts.map(async (p) => {
          const priceDoc = await Price.findOne({
            productId: p.productId,
          }).lean();
          return {
            ...p,
            price: priceDoc?.price || 0,
            score: 0,
          };
        }),
      );
    }

    console.log(
      "🔹 Final recommendations:",
      recommendations.map((r) => ({
        id: r._id,
        price: r.price,
        score: r.score.toFixed(3),
      })),
    );

    res.json({ recommendations });
  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
};

const Price = require("../models/Price");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const Product = require("../models/Product");

const HF_KEY = process.env.HUGGINGFACE_API_KEY;
const EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5";

async function getEmbedding(text) {
  const url = `https://router.huggingface.co/hf-inference/models/${EMBEDDING_MODEL}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HF_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs: text,
      options: {
        wait_for_model: true,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HF API error: ${res.status} ${errorText}`);
  }

  const result = await res.json();

  if (Array.isArray(result)) {
    if (Array.isArray(result[0])) {
      return result[0];
    }
    if (typeof result[0] === "number") {
      return result;
    }
  }

  throw new Error("Unexpected embedding response");
}

function cosineSim(a, b) {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-10);
}

const chatWithBot = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    const lowerMsg = message.toLowerCase().trim();
    console.log("📝 User query:", message);

    // 🟢 Step 0: Handle small talk / greetings / casual chat
    const greetings = ["hi", "hello", "hey", "hy", "good morning", "good evening", "good afternoon"];
    const thanks = ["thank", "thanks", "thank you"];
    const about = ["who are you", "what can you do", "help", "your name"];

    // 👋 Greeting messages (includes "hy" now)
    if (greetings.some((g) => lowerMsg === g || lowerMsg.startsWith(g))) {
      return res.json({
        answer:
          "👋 Hi there! I'm your ShopSphere Assistant. You can ask me about any product — like *blue handbags*, *men’s watches*, or *sunglasses*! 😊",
        topProducts: [],
      });
    }

    // 🙏 Thanks
    if (thanks.some((g) => lowerMsg.includes(g))) {
      return res.json({
        answer:
          "You're most welcome! 💖 Let me know if you'd like to explore more products or categories.",
        topProducts: [],
      });
    }

    // 🧠 About / Help
    if (about.some((g) => lowerMsg.includes(g))) {
      return res.json({
        answer:
          "I'm ShopSphere’s AI shopping assistant! 🛍️ I can help you find products by color, category, or style — just tell me what you’re looking for!",
        topProducts: [],
      });
    }

    // 🚫 Handle yes/no messages to avoid unwanted product searches
    if (["yes", "no", "yeah", "nope", "yup"].includes(lowerMsg)) {
      return res.json({
        answer:
          "Please continue your previous action — like adding a product or going to checkout. 😊",
        topProducts: [],
      });
    }

    // 1️⃣ Create embedding for user query
    const qEmbedding = await getEmbedding(message);
    console.log("🔢 Query embedding:", qEmbedding.length, "dimensions");

    // 2️⃣ Retrieve products with embeddings
    const products = await Product.find({
      embedding: { $exists: true, $ne: [] },
    }).lean();

    console.log("📦 Found", products.length, "products with embeddings");

    if (!products.length) {
      return res.status(400).json({
        error: "No product embeddings found.",
      });
    }

    // 3️⃣ Compute similarity
    const ranked = products
      .map((p) => ({
        p,
        score: cosineSim(qEmbedding, p.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    console.log("🎯 Top matches:");
    ranked.forEach((item, idx) => {
      console.log(
        `  ${idx + 1}. ${item.p.productDisplayName} (score: ${item.score.toFixed(3)})`
      );
    });

    // 🟢 Get the top products
    const topProducts = [];

    for (const { p } of ranked) {
      const priceDoc = await Price.findOne({ productId: p.productId }).lean();

      topProducts.push({
        _id: p.productId || p._id,
        productId: p.productId,
        productDisplayName: p.productDisplayName,
        baseColour: p.baseColour,
        gender: p.gender,
        imageFilename: p.imageFilename,
        price: priceDoc ? priceDoc.price : 0,
      });
    }

    // 4️⃣ Generate chatbot answer
    let answer = "";
    const count = topProducts.length;

    if (lowerMsg.includes("watch")) {
      answer = `I found ${count} great watches that match your search! Check out these ${topProducts[0].gender.toLowerCase()} watches in ${topProducts[0].baseColour.toLowerCase()}. ⌚`;
    } else if (lowerMsg.includes("handbag") || lowerMsg.includes("bag")) {
      answer = `Perfect! I found ${count} stylish handbags for you. These ${topProducts[0].baseColour.toLowerCase()} bags would look amazing! 👜`;
    } else if (lowerMsg.includes("sunglasses") || lowerMsg.includes("glasses")) {
      answer = `I've got ${count} awesome sunglasses options! These would look great on you! 😎`;
    } else if (
      lowerMsg.includes("earring") ||
      lowerMsg.includes("jewelry") ||
      lowerMsg.includes("necklace")
    ) {
      answer = `Found ${count} beautiful jewelry pieces for you! These would add perfect sparkle to any outfit! ✨`;
    } else if (lowerMsg.includes("shoe") || lowerMsg.includes("footwear")) {
      answer = `Here are ${count} shoe options that match what you're looking for! 👟`;
    } else {
      answer = `Great choice! I found ${count} products that match your search. 🛍️`;
    }

    answer += "\n\nClick any product below to learn more!";

    console.log("✅ Sending response\n");
    res.json({ answer, topProducts });
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: "Failed to process request" });
  }
};


module.exports = { chatWithBot };

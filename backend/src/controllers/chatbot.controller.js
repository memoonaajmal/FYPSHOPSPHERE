const Price = require("../models/Price");
const cosineSim = require("../utils/similarity");
const { getEmbedding } = require("../utils/embedding");
const Store = require("../models/Store");

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const Product = require("../models/Product");

const HF_KEY = process.env.HUGGINGFACE_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5";

// Generate response using Groq API
async function generateAIResponse(userMessage, products = []) {
  const url = "https://api.groq.com/openai/v1/chat/completions";

  // Build context about products with PKR currency
  let productContext = "";
  if (products.length > 0) {
    productContext = "\n\nI found these products:\n";
    products.forEach((p, idx) => {
      productContext += `${idx + 1}. ${p.productDisplayName} - ${p.baseColour} ${p.gender} - PKR ${p.price}\n`;
    });
  }

  const systemPrompt = `You are ShopSphere Assistant, a friendly AI shopping assistant for an e-commerce platform in Pakistan.

Your role:
- Help users find products they're looking for
- Be enthusiastic and use emojis appropriately (👜, ⌚, 😎, ✨, 🛍️, 💍, 👟)
- Keep responses concise (2-3 sentences max)
- When products are found, briefly describe them and encourage exploration
- Be warm, helpful, and conversational

Guidelines:
- Only reference products that are provided to you
- Don't make up product details
- Be natural and friendly
- Always use PKR (Pakistani Rupees) as the currency
- Always end with encouragement to explore`;

  const userPrompt = `User query: "${userMessage}"${productContext}

Generate a brief, friendly response (2-3 sentences max). Remember to use PKR for currency.`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 150,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq API error: ${res.status} ${errorText}`);
  }

  const result = await res.json();
  console.log("Token usage:", result.usage);

  return result.choices[0].message.content;
}

const chatWithBot = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    const lowerMsg = message.toLowerCase().trim();
    console.log("User query:", message);

    const greetings = [
      "hi",
      "hello",
      "hey",
      "hy",
      "good morning",
      "good evening",
      "good afternoon",
    ];
    const thanks = ["thank", "thanks", "thank you"];
    const about = ["who are you", "what can you do", "help", "your name"];

    // Handle simple queries with AI
    if (greetings.some((g) => lowerMsg === g || lowerMsg.startsWith(g))) {
      try {
        const answer = await generateAIResponse(message, []);
        return res.json({ answer, topProducts: [] });
      } catch (error) {
        console.error("AI error:", error.message);
        return res.json({
          answer:
            "👋 Hi there! I'm your ShopSphere Assistant. Ask me about any product!",
          topProducts: [],
        });
      }
    }

    if (thanks.some((g) => lowerMsg.includes(g))) {
      try {
        const answer = await generateAIResponse(message, []);
        return res.json({ answer, topProducts: [] });
      } catch (error) {
        return res.json({
          answer:
            "You're welcome! 💖 Let me know if you'd like to explore more products.",
          topProducts: [],
        });
      }
    }

    if (about.some((g) => lowerMsg.includes(g))) {
      try {
        const answer = await generateAIResponse(message, []);
        return res.json({ answer, topProducts: [] });
      } catch (error) {
        return res.json({
          answer:
            "I'm ShopSphere's AI shopping assistant! 🛍️ I can help you find products!",
          topProducts: [],
        });
      }
    }

    // Handle yes/no messages
    if (["yes", "no", "yeah", "nope", "yup"].includes(lowerMsg)) {
      return res.json({
        answer:
          "Please continue your previous action — like adding a product or going to checkout. 😊",
        topProducts: [],
      });
    }

    // Create embedding for user query
    let qEmbedding;
    try {
      qEmbedding = await getEmbedding(message);
    } catch (e) {
      console.error("Embedding failed:", e.message);
      return res.json({
        answer:
          "I'm having trouble understanding your request right now, but you can browse products manually 🛍️",
        topProducts: [],
      });
    }

    console.log("Query embedding:", qEmbedding.length, "dimensions");

    // Retrieve products with embeddings
    const products = await Product.find({
      embedding: { $exists: true, $ne: [] },
    }).lean();

    console.log("Found", products.length, "products with embeddings");

    if (!products.length) {
      return res.status(400).json({
        error: "No product embeddings found.",
      });
    }

    // Compute similarity
    const ranked = products
      .map((p) => ({
        p,
        score: cosineSim(qEmbedding, p.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    console.log("Top matches:");
    ranked.forEach((item, idx) => {
      console.log(
        `  ${idx + 1}. ${item.p.productDisplayName} (score: ${item.score.toFixed(3)})`,
      );
    });

    // Get the top products
    const topProducts = [];

    for (const { p } of ranked) {
      const priceDoc = await Price.findOne({ productId: p.productId }).lean();

      const store = await Store.findOne({ productIds: p.productId }).lean();

      topProducts.push({
        _id: p._id.toString(), // Mongo ObjectId 
        productId: p.productId,
        productDisplayName: p.productDisplayName,
        baseColour: p.baseColour,
        gender: p.gender,
        imageFilename: p.imageFilename,
        price: priceDoc ? priceDoc.price : 0,
        storeId: store ? store._id.toString() : null,
      });
    }

    // Generate response using AI
    let answer;
    try {
      answer = await generateAIResponse(message, topProducts);
      // Add call-to-action if not already present
      if (!answer.includes("Click") && !answer.includes("below")) {
        answer += "\n\nClick any product below to learn more!";
      }
    } catch (aiError) {
      console.error("AI error:", aiError.message);
      // Fallback to simple response
      answer = `Great choice! I found ${topProducts.length} products that match your search. 🛍️\n\nClick any product below to learn more!`;
    }

    console.log("Sending response\n");
    res.json({ answer, topProducts });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Failed to process request" });
  }
};

module.exports = {
  chatWithBot
};

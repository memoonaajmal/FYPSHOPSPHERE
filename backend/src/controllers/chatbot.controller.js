const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { streamText } = require("ai");
const { huggingface } = require("@ai-sdk/huggingface");
const Product = require("../models/Product");

const HF_KEY = process.env.HUGGINGFACE_API_KEY;
const EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5";
const GENERATION_MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

async function getEmbedding(text) {
  const url = `https://router.huggingface.co/hf-inference/models/${EMBEDDING_MODEL}`;
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${HF_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
      options: {
        wait_for_model: true
      }
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
    if (typeof result[0] === 'number') {
      return result;
    }
  }
  
  throw new Error("Unexpected embedding response");
}

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
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

    console.log('📝 User query:', message);

    // 1️⃣ Create embedding for user query
    const qEmbedding = await getEmbedding(message);
    console.log('🔢 Query embedding:', qEmbedding.length, 'dimensions');

    // 2️⃣ Retrieve products with embeddings
    const products = await Product.find({ 
      embedding: { $exists: true, $ne: [] } 
    }).lean();
    
    console.log('📦 Found', products.length, 'products with embeddings');
    
    if (!products.length) {
      return res.status(400).json({ 
        error: "No product embeddings found." 
      });
    }

    // 3️⃣ Compute similarity
    const ranked = products
      .map((p) => ({ 
        p, 
        score: cosineSim(qEmbedding, p.embedding) 
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    console.log('🎯 Top matches:');
    ranked.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.p.productDisplayName} (score: ${item.score.toFixed(3)})`);
    });

    const topProducts = ranked.map(x => x.p);

    // 4️⃣ Generate concise, conversational answer
    let answer = '';
    
    // Determine product category for personalized response
    const count = topProducts.length;
    
    // Create context-aware responses
    if (message.toLowerCase().includes('watch')) {
      answer = `I found ${count} great watches that match your search! Check out these ${topProducts[0].gender.toLowerCase()} watches in ${topProducts[0].baseColour.toLowerCase()}. ⌚`;
    } else if (message.toLowerCase().includes('handbag') || message.toLowerCase().includes('bag')) {
      answer = `Perfect! I found ${count} stylish handbags for you. These ${topProducts[0].baseColour.toLowerCase()} bags would look amazing! 👜`;
    } else if (message.toLowerCase().includes('sunglasses') || message.toLowerCase().includes('glasses')) {
      answer = `I've got ${count} awesome sunglasses options! These would look great on you! 😎`;
    } else if (message.toLowerCase().includes('earring') || message.toLowerCase().includes('jewelry') || message.toLowerCase().includes('necklace')) {
      answer = `Found ${count} beautiful jewelry pieces for you! These would add perfect sparkle to any outfit! ✨`;
    } else if (message.toLowerCase().includes('shoe') || message.toLowerCase().includes('footwear')) {
      answer = `Here are ${count} shoe options that match what you're looking for! 👟`;
    } else {
      // Generic response
      answer = `Great choice! I found ${count} products that match your search. 🛍️`;
    }

    // Add helpful follow-up
    answer += '\n\nClick any product below to learn more!';

    console.log('✅ Sending response\n');
    res.json({ answer, topProducts });
    
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: "Failed to process request" });
  }
};

module.exports = { chatWithBot };
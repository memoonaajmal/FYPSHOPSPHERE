require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/Product');

const MONGO =
  process.env.MONGO_URL && process.env.DB_NAME
    ? `${process.env.MONGO_URL}/${process.env.DB_NAME}`
    : process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopsphere';

const HF_KEY = process.env.HUGGINGFACE_API_KEY;
// ✅ This model is configured for feature extraction
const EMBEDDING_MODEL = 'BAAI/bge-small-en-v1.5';

if (!HF_KEY) {
  console.error('Missing HUGGINGFACE_API_KEY in .env');
  process.exit(1);
}

async function getEmbedding(text) {
  const url = `https://api-inference.huggingface.co/models/${EMBEDDING_MODEL}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: text,
      options: {
        wait_for_model: true
      }
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HF API error: ${res.status} ${errorText}`);
  }

  const result = await res.json();
  
  // Handle response format
  if (Array.isArray(result)) {
    if (Array.isArray(result[0])) {
      return result[0];
    }
    if (typeof result[0] === 'number') {
      return result;
    }
  }
  
  throw new Error('Unexpected embedding format: ' + JSON.stringify(result).slice(0, 300));
}

async function main() {
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('✅ Connected to MongoDB');
  console.log("📁 Database:", mongoose.connection.name);

  // Test the API first
  console.log('\n🧪 Testing HuggingFace API...');
  try {
    const testEmbedding = await getEmbedding('test product');
    console.log(`✅ API test successful! Embedding size: ${testEmbedding.length} dimensions\n`);
  } catch (err) {
    console.error('❌ API test failed:', err.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Verify your API key at: https://huggingface.co/settings/tokens');
    console.error('  2. Make sure you have internet connection');
    console.error('  3. The model might be loading (can take 1-2 minutes on first use)\n');
    process.exit(1);
  }

  // Find products without embeddings
  const totalCount = await Product.countDocuments({
    $or: [
      { embedding: { $exists: false } },
      { embedding: { $size: 0 } }
    ]
  });
  
  console.log(`📦 Found ${totalCount} products without embeddings\n`);
  
  if (totalCount === 0) {
    console.log('✅ All products already have embeddings!');
    await mongoose.disconnect();
    return;
  }
  
  const cursor = Product.find({
    $or: [
      { embedding: { $exists: false } },
      { embedding: { $size: 0 } }
    ]
  }).cursor();

  let count = 0;
  let errors = 0;
  const startTime = Date.now();
  
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    try {
      const text = `${doc.productDisplayName || ''} ${doc.masterCategory || ''} ${doc.subCategory || ''} ${doc.articleType || ''} ${doc.baseColour || ''}`.trim();
      
      if (!text) {
        console.log(`⚠️  Skipping product ${doc.productId} - no text to embed`);
        continue;
      }
      
      const embedding = await getEmbedding(text);
      
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Invalid embedding returned');
      }
      
      doc.embedding = embedding;
      await doc.save();
      
      count++;
      const progress = ((count / totalCount) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const eta = count > 0 ? (((Date.now() - startTime) / count) * (totalCount - count) / 1000).toFixed(0) : '?';
      
      console.log(`✅ [${count}/${totalCount}] (${progress}%) ${doc.productDisplayName || doc.productId} | Elapsed: ${elapsed}s | ETA: ${eta}s`);
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (err) {
      errors++;
      console.error(`❌ [${doc.productId}] ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Successfully indexed: ${count} products`);
  console.log(`❌ Failed: ${errors} products`);
  console.log(`⏱️  Total time: ${totalTime} seconds`);
  console.log(`${'='.repeat(60)}\n`);
  
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
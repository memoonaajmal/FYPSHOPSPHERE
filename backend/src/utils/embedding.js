const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

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
      options: { wait_for_model: true },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HF API error: ${res.status} ${errorText}`);
  }

  const result = await res.json();

  if (Array.isArray(result)) {
    if (Array.isArray(result[0])) return result[0];
    if (typeof result[0] === "number") return result;
  }

  throw new Error("Unexpected embedding response");
}

module.exports = { getEmbedding };
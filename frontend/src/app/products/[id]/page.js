import Image from "next/image";
import { notFound } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL; // http://localhost:4000

async function fetchProduct(productId) {
  const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
}

export default async function ProductDetailsPage({ params }) {
  const { id } = await params; // ✅ only change here
  const product = await fetchProduct(id);

  if (!product) {
    notFound();
  }

  // Always absolute
  const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;

  return (
    <div style={{ display: "flex", gap: 24, padding: 24 }}>
      <div style={{ minWidth: 400 }}>
        <Image
          src={imageSrc}
          alt={product.productDisplayName || "Product"}
          width={400}
          height={400}
        />
      </div>

      <div>
        <h1>{product.productDisplayName}</h1>
        <p><strong>Color:</strong> {product.baseColour}</p>
        <p><strong>Type:</strong> {product.articleType}</p>
        <p><strong>Season:</strong> {product.season}</p>
        <p><strong>Year:</strong> {product.year}</p>
        <p><strong>Description:</strong> {product.description || "—"}</p>
      </div>
    </div>
  );
}

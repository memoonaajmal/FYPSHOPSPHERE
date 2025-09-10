import Image from "next/image";
import { notFound } from "next/navigation";
import styles from "../../../styles/ProductDetails.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

async function fetchProduct(productId) {
  const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
}

export default async function ProductDetailsPage({ params }) {
  const { id } = await params;
  const product = await fetchProduct(id);

  if (!product) {
    notFound();
  }

  const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;

  return (
    <div className={styles.container}>
      <div className={styles.imageWrapper}>
        <Image
          src={imageSrc}
          alt={product.productDisplayName || "Product"}
          width={500}
          height={500}
        />
      </div>

      <div className={styles.details}>
        <h1>{product.productDisplayName}</h1>
        <p className={styles.price}>$99.00</p> {/* Placeholder price */}
        <p><strong>Color:</strong> {product.baseColour}</p>
        <p><strong>Type:</strong> {product.articleType}</p>
       

        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`}>
            Add to Cart
          </button>
          <button className={`${styles.btn} ${styles.btnSecondary}`}>
            Wishlist
          </button>
        </div>
      </div>
    </div>
  );
}

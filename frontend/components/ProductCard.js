"use client";
import Image from "next/image";
import Link from "next/link";
import styles from "./styles/ProductCard.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL; // http://localhost:4000

export default function ProductCard({ product }) {
  if (!product) return null;

  const id = product.productId || product._id;

  // Always build absolute URL
  const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;

  return (
    <Link href={`/products/${id}`} className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={imageSrc}
          alt={product.productDisplayName || "Product"}
          width={250}
          height={250}
          className={styles.image}
        />
      </div>

      <div className={styles.info}>
        <h3 className={styles.title}>{product.productDisplayName}</h3>
        <p className={styles.color}>{product.baseColour}</p>
        <p className={styles.type}>{product.articleType}</p>
      </div>
    </Link>
  );
}

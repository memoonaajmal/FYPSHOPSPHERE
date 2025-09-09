"use client";
import Image from "next/image";
import styles from "./styles/ProductCard.module.css";

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function ProductCard({ product }) {
  if (!product) return null;

  const imageUrl = `${BASE_URL}/images/${product.imageFilename}`;

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        <Image
          src={imageUrl}
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
    </div>
  );
}

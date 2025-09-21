"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "../src/styles/SellerProductPage.module.css"; // adjust path if needed

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function SellerProductCard({ product, onDelete }) {
  if (!product) return null;

  const id = product.productId || product._id;

  const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;

  const handleDelete = () => {
    if (onDelete) onDelete(id);
  };

  return (
    <div className={styles.card}>
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
        <h3 className={styles.titleCard}>{product.productDisplayName}</h3>
        <p className={styles.color}>{product.baseColour}</p>
        <p className={styles.type}>{product.articleType}</p>
        <p className={styles.price}>Pkr {product.price ?? 0}</p>
      </div>

      <div className={styles.cardButtons}>
        <Link
          href={`/seller/products/update/${id}`}
          className={styles.updateBtn}
        >
          Update
        </Link>
        <button
          onClick={handleDelete}
          className={styles.deleteBtn}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

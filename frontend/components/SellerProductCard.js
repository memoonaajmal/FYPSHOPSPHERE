"use client";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react"; // ✅ delete icon
import styles from "./styles/SellerProductCard.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL; // http://localhost:4000

export default function AdminProductCard({ product, onDelete }) {
  if (!product) return null;

  const id = product.productId || product._id;

  // Always build absolute URL
  const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;

  return (
    <div className={styles.card}>
      {/* ✅ Image (not clickable anymore) */}
      <div className={styles.imageWrapper}>
        <Image
          src={imageSrc}
          alt={product.productDisplayName || "Product"}
          width={250}
          height={250}
          className={styles.image}
        />
      </div>

      {/* Info + Actions */}
      <div className={styles.info}>
        <h3 className={styles.title}>{product.productDisplayName}</h3>
        <p className={styles.color}>{product.baseColour}</p>
        <p className={styles.type}>{product.articleType}</p>

        <div className={styles.actions}>
          <Link
            href={`/seller/products/update/${id}`}
            className={styles.updateBtn}
          >
            Update
          </Link>

          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this product?")) {
                onDelete(product.productId || product._id);
              }
            }}
            className={styles.deleteBtn}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

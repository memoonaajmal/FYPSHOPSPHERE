"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./styles/ProductCard.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function ProductCard({ product }) {
  const router = useRouter();

  if (!product) return null;

  const id = product.productId || product._id;
  if (!id) return null;

  const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;

  return (
    <div
      onClick={() => router.push(`/user/products/${id}`)}
      className={styles.card}
      style={{ cursor: "pointer" }}
    >
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
    </div>
  );
}

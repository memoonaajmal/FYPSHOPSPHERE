"use client";

import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import styles from "../src/styles/SuccessCheckout.module.css";

export default function Recommendations({ token, variant = "slider" }) {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/recommendation/recommendations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch recommendations");
        const data = await res.json();
        setProducts(data.recommendations || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchRecommendations();
  }, [token]);

  if (loading) return <p>Loading recommendations...</p>;
  if (!products.length) return <p>No recommendations available</p>;

  // Duplicate products for seamless scroll
  const scrollProducts = [...products, ...products];

  return (
    <div className={styles.scrollContainer}>
      <div className={styles.scrollContent}>
        {scrollProducts.map((p, idx) => (
          <div key={`${p.productId}-${idx}`} className={styles.productCardWrapper}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
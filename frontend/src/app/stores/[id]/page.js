"use client";
import { use, useEffect, useState } from "react";
import ProductCard from "../../../../components/ProductCard";
import styles from "../../../styles/store.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function StorePage({ params }) {
  // ✅ unwrap the Promise
  const { id } = use(params);

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!id) return;

    fetch(`${BASE_URL}/api/stores/${id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Store API response:", data);
        setStore(data?.store || null);
        setProducts(data?.products || []);
      })
      .catch((err) => console.error("Error fetching store:", err));
  }, [id]);

  if (!store) return <p>Loading store...</p>;

return (
  <div className={styles.container}>
    {/* ✅ Hero Banner */}
    <section className={styles.heroBanner}>
      <div className={styles.heroContent}>
        <h1 className={styles.storeTitle}>{store?.name || "Unnamed Store"}</h1>
        <p className={styles.storeSubtitle}>
          {Array.isArray(store?.categories) && store.categories.length > 0
            ? `Shop by categories: ${store.categories.join(", ")}`
            : "Discover our wide collection of products!"}
        </p>
      </div>
    </section>

    {/* ✅ Products Section */}
    <section className={styles.productsSection}>
      <h2 className={styles.productsHeading}>Products</h2>
      <div className={styles.productsGrid}>
        {products.length > 0 ? (
          products.map((p) => (
            <ProductCard key={p.productId || p._id} product={p} />
          ))
        ) : (
          <p className={styles.emptyState}>No products found for this store.</p>
        )}
      </div>
    </section>
  </div>
);

}

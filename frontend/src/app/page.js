"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL; // http://localhost:4000

export default function HomePage() {
  const [stores, setStores] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/stores`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Stores API response:", data);
        if (Array.isArray(data)) {
          setStores(data);
        } else if (data && data.stores) {
          setStores(data.stores);
        } else {
          setStores([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching stores:", err);
        setStores([]);
      });
  }, []);

  return (
    <div className={styles.container}>
      {/* ✅ Hero Banner */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>SHOPSPHERE</h1>
          <p className={styles.heroSubtitle}>
            Discover the best stores & exclusive collections
          </p>
          <a href="/products" className={styles.heroButton}>
            Explore Products
          </a>
        </div>
      </section>

      {/* ✅ Stores Section */}
      <section id="stores" className={styles.storesSection}>
        <h2 className={styles.heading}>Our Stores</h2>

        <div className={styles.grid}>
          {stores.length > 0 ? (
            stores.map((store) => (
              <Link
                key={store._id}
                href={`/stores/${store._id}`}
                className={styles.storeCard}
              >
                <h3 className={styles.storeName}>{store.name}</h3>

                {/* ✅ Display categories in divs */}
                <div className={styles.categories}>
                  {store.categories.map((cat, i) => (
                    <span key={i} className={styles.categoryBadge}>
                      {cat}
                    </span>
                  ))}
                </div>
              </Link>
            ))
          ) : (
            <p>No stores found</p>
          )}
        </div>
      </section>
    </div>
  );
}

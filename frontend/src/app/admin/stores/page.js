"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../../../styles/AllStoresAdmin.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);  // ✅ define loading state
  const [error, setError] = useState(null);      // ✅ define error state

  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch(`${BASE_URL}/api/stores`);
        const data = await res.json();

        if (Array.isArray(data)) setStores(data);
        else if (data?.stores) setStores(data.stores);
        else setStores([]);
      } catch (err) {
        setError("Failed to load stores.");
        setStores([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStores();
  }, []);

  return (
    <div style={{ padding: "24px" }}>
      <h1 className={styles.heading}>
        Store Management
      </h1>

      {/* Stores Section */}
      <section id="stores" className={styles.storesSection}>
        <h2 className={styles.heading}>Our Stores</h2>

        {loading ? (
          <p>Loading stores...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : stores.length === 0 ? (
          <p>No stores found.</p>
        ) : (
          <div className={styles.grid}>
            {stores.map((store) => (
              <Link
                key={store._id}
                href={`/Adminstores/${store._id}`}
                className={styles.storeCard}
              >
                <h3 className={styles.storeName}>{store.name}</h3>
                {Array.isArray(store.categories) && store.categories.length > 0 && (
                  <div className={styles.categories}>
                    {store.categories.map((cat, i) => (
                      <span key={i} className={styles.categoryBadge}>
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

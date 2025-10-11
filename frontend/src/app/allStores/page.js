"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../../styles/allStoresPage.module.css"; // Create this CSS module

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function AllStoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      } finally {
        setLoading(false);
      }
    }

    fetchStores();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>All Stores</h1>

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
              href={`/stores/${store._id}`}
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
    </div>
  );
}

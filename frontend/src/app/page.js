"use client";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

function HomeContent() {
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
        setStores([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStores();
  }, []);

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>SHOPSPHERE</h1>
          <p className={styles.heroSubtitle}>
            Discover the best stores & exclusive collections
          </p>
          <Link href="/products" className={styles.heroButton}>
            Explore Products
          </Link>
        </div>
      </section>

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
              <Link key={store._id} href={`/stores/${store._id}`} className={styles.storeCard}>
                <h3 className={styles.storeName}>{store.name}</h3>
                {Array.isArray(store.categories) && store.categories.length > 0 && (
                  <div className={styles.categories}>
                    {store.categories.map((cat, i) => (
                      <span key={i} className={styles.categoryBadge}>{cat}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLinks}>
            <Link href="/about" className={styles.footerLink}>About Us</Link>
            <Link href="/contact" className={styles.footerLink}>Contact</Link>
            <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
          </div>
          <p className={styles.footerCopy}>
            &copy; {new Date().getFullYear()} SHOPSPHERE. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ✅ HomePage is now strictly protected for "user" role only
export default function HomePage() {
  return (
    <ProtectedRoute role="user">
      <HomeContent />
    </ProtectedRoute>
  );
}

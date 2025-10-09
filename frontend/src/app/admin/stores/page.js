"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import styles from "../styles/AllStoresAdmin.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6; // Number of stores per page

  useEffect(() => {
    async function fetchStores() {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/api/admin/stores?page=${currentPage}&limit=${limit}`);
        const data = await res.json();

        if (data?.stores) {
          setStores(data.stores);
          setTotalPages(data.totalPages || 1);
        } else if (Array.isArray(data)) {
          setStores(data);
        } else {
          setStores([]);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load stores.");
      } finally {
        setLoading(false);
      }
    }

    fetchStores();
  }, [currentPage]);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.mainHeading}>Store Management</h1>

      <section id="stores" className={styles.storesSection}>
        <h2 className={styles.subHeading}>All Registered Stores</h2>

        {loading ? (
          <p className={styles.loading}>Loading stores...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : stores.length === 0 ? (
          <p className={styles.empty}>No stores found.</p>
        ) : (
          <>
            <div className={styles.grid}>
              {stores.map((store) => (
                <Link
                  key={store._id}
                  href={`/Adminstores/${store._id}`}
                  className={styles.storeCard}
                >
                  <h3 className={styles.storeName}>{store.name}</h3>

                  {/* ✅ Graph + Stats Side by Side */}
<div className={styles.statsContainer}>
  <div className={styles.miniGraph}>
    <ResponsiveContainer width="100%" height={120}>
      <BarChart
        data={[
          {
            name: "Stats",
            Sales: store.totalSales || 0,
            Orders: store.totalOrders || 0,
          },
        ]}
        margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" hide />

        {/* ✅ Left Y-axis for Sales */}
        <YAxis yAxisId="left" orientation="left" />
        {/* ✅ Right Y-axis for Orders */}
        <YAxis yAxisId="right" orientation="right" />

        <Tooltip />

        {/* ✅ Sales bar (left axis) */}
        <Bar
          yAxisId="left"
          dataKey="Sales"
          fill="#4f46e5"
          barSize={40}
          radius={[6, 6, 0, 0]}
        />

        {/* ✅ Orders bar (right axis) */}
        <Bar
          yAxisId="right"
          dataKey="Orders"
          fill="#22c55e"
          barSize={40}
          radius={[6, 6, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>

  <div className={styles.stats}>
    <p><strong>Sales:</strong> ${store.totalSales || 0}</p>
    <p><strong>Orders:</strong> {store.totalOrders || 0}</p>
  </div>
</div>


                  {/* ✅ Categories */}
                  {Array.isArray(store.categories) && store.categories.length > 0 && (
                    <div className={styles.categories}>
                      {store.categories.slice(0, 3).map((cat, i) => (
                        <span key={i} className={styles.categoryBadge}>
                          {cat}
                        </span>
                      ))}
                      {store.categories.length > 3 && (
                        <span className={styles.moreBadge}>+{store.categories.length - 3}</span>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>

            {/* ✅ Pagination */}
            <div className={styles.pagination}>
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className={styles.pageButton}
              >
                ⬅ Prev
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={styles.pageButton}
              >
                Next ➡
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

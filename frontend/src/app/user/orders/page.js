"use client";
import { useEffect, useState } from "react";
import { auth } from "../../../../firebase/config";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "../../../styles/Orders.module.css";
import UserOrderCard from "../../../../components/UserOrderCard";
import OrderPagination from "../../../../components/OrderPagination";

export default function UserOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();
  const params = useSearchParams();
  const page = parseInt(params.get("page") || "1", 10);
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { router.push("/login"); return; }
      try {
        setLoading(true);
        const token = await getIdToken(currentUser);
        const res = await fetch(`${BASE_URL}/api/orders?page=${page}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 401) router.push("/login");
          throw new Error("Failed to fetch orders");
        }
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router, BASE_URL, page]);

  const stats = orders.reduce(
    (acc, order) => {
      const status = order.paymentStatus?.toLowerCase();
      if (status === "paid") acc.paid++;
      else if (status === "returned") acc.returned++;
      else acc.pending++;
      return acc;
    },
    { paid: 0, pending: 0, returned: 0 }
  );

  const filteredOrders = orders.filter((order) => {
    const status = order.paymentStatus?.toLowerCase();
    if (activeFilter !== "all" && status !== activeFilter) return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      order.trackingId?.toLowerCase().includes(q) ||
      order._id?.toLowerCase().includes(q)
    );
  });

  if (loading) return <p className={styles.loadingText}>Loading your orders...</p>;
  if (error) return <p className={styles.errorText}>Error: {error}</p>;

  return (
    <div className={styles.dashboard}>

      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>My Orders</h1>
        <p className={styles.subtitle}>Track your order history and payment status</p>
      </div>

      {/* Content */}
      <div className={styles.content}>

        {/* Search */}
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by tracking ID…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Stats / Filters */}
        {orders.length > 0 && (
          <div className={styles.statsBar}>
            <div
              className={`${styles.statPill} ${activeFilter === "all" ? styles.active : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              <span className={`${styles.statDot} ${styles.dotAll}`} />
              {orders.length} Total
            </div>

            {stats.pending > 0 && (
              <div
                className={`${styles.statPill} ${activeFilter === "pending" ? styles.active : ""}`}
                onClick={() => setActiveFilter("pending")}
              >
                <span className={`${styles.statDot} ${styles.dotPending}`} />
                {stats.pending} Pending
              </div>
            )}

            {stats.paid > 0 && (
              <div
                className={`${styles.statPill} ${activeFilter === "paid" ? styles.active : ""}`}
                onClick={() => setActiveFilter("paid")}
              >
                <span className={`${styles.statDot} ${styles.dotPaid}`} />
                {stats.paid} Paid
              </div>
            )}

            {stats.returned > 0 && (
              <div
                className={`${styles.statPill} ${activeFilter === "returned" ? styles.active : ""}`}
                onClick={() => setActiveFilter("returned")}
              >
                <span className={`${styles.statDot} ${styles.dotReturned}`} />
                {stats.returned} Returned
              </div>
            )}
          </div>
        )}

        {/* Orders or Empty */}
        {filteredOrders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <p>No orders match your filters.</p>
          </div>
        ) : (
          <UserOrderCard orders={filteredOrders} page={page} />
        )}

        {totalPages > 1 && <OrderPagination totalPages={totalPages} />}
      </div>
    </div>
  );
}
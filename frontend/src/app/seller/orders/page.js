"use client";

import { useEffect, useState } from "react";
import { auth } from "../../../../firebase/config";
import styles from "../styles/SellerOrdersPage.module.css";
import SellerOrderCard from "../../../../components/SellerOrderCard";
import OrderPagination from "../../../../components/OrderPagination";
import { useSearchParams } from "next/navigation";

export default function SellerOrdersPage() {
  const params = useSearchParams();
  const page = parseInt(params.get("page") || "1", 10);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [storeId, setStoreId] = useState(null);

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const stats = orders.reduce(
  (acc, order) => {
    const status = (order.myPaymentStatus || order.paymentStatus)?.toLowerCase();
    if (status === "paid") acc.paid++;
    else if (status === "returned") acc.returned++;
    else acc.pending++;
    return acc;
  },
  { paid: 0, pending: 0, returned: 0 }
);
const filteredOrders = orders.filter((order) => {
  const status = (
    order.myPaymentStatus || order.paymentStatus
  )?.toLowerCase();

  // status filter
  if (activeFilter !== "all" && status !== activeFilter) {
    return false;
  }

  // search filter
  if (!searchTerm.trim()) return true;

  const q = searchTerm.toLowerCase();
  return (
    order.email?.toLowerCase().includes(q) ||
    order.trackingId?.toLowerCase().includes(q)
  );
});

  useEffect(() => {
    const fetchStoreId = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/seller/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        setStoreId(data.storeId);
      }
    };

    fetchStoreId();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");

      const token = await user.getIdToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/seller/orders?page=${page}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      let ordersList = Array.isArray(data.orders) ? data.orders : [];

      if (storeId) {
        ordersList = ordersList.map((order) => {
          const myItems = order.items.filter((i) => i.storeId === storeId);
          let myPaymentStatus = "pending";

          if (myItems.every((i) => i.itemPaymentStatus === "paid")) {
            myPaymentStatus = "paid";
          } else if (
            myItems.every((i) => i.itemPaymentStatus === "returned")
          ) {
            myPaymentStatus = "returned";
          }

          return { ...order, myPaymentStatus };
        });
      }

      setOrders(ordersList);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (storeId) fetchOrders();
  }, [page, storeId]);

  if (loading) return <p className={styles.loadingText}>Loading orders…</p>;
  if (error) return <p className={styles.errorText}>{error}</p>;

  return (
    <div className={styles.dashboard}>
      {/* ===== Header (ADMIN STYLE) ===== */}
      <div className={styles.header}>
        <h1 className={styles.title}>Order History</h1>
        <p className={styles.subtitle}>
          View and manage all orders placed in your store
        </p>
      </div>

      {/* ===== Content ===== */}
      <div className={styles.content}>
        {/* ===== Search ===== */}
<div className={styles.searchBar}>
  <input
    type="text"
    placeholder="Search by email or tracking ID…"
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className={styles.searchInput}
  />
</div>
        {/* ===== Stats Bar (Clickable Filters) ===== */}
{orders.length > 0 && (
  <div className={styles.statsBar}>
    <div
      className={`${styles.statPill} ${
        activeFilter === "all" ? styles.active : ""
      }`}
      onClick={() => setActiveFilter("all")}
    >
      <span className={`${styles.statDot} ${styles.dotAll}`} />
      {orders.length} Total
    </div>

    {stats.pending > 0 && (
      <div
        className={`${styles.statPill} ${
          activeFilter === "pending" ? styles.active : ""
        }`}
        onClick={() => setActiveFilter("pending")}
      >
        <span className={`${styles.statDot} ${styles.dotPending}`} />
        {stats.pending} Pending
      </div>
    )}

    {stats.paid > 0 && (
      <div
        className={`${styles.statPill} ${
          activeFilter === "paid" ? styles.active : ""
        }`}
        onClick={() => setActiveFilter("paid")}
      >
        <span className={`${styles.statDot} ${styles.dotPaid}`} />
        {stats.paid} Paid
      </div>
    )}

    {stats.returned > 0 && (
      <div
        className={`${styles.statPill} ${
          activeFilter === "returned" ? styles.active : ""
        }`}
        onClick={() => setActiveFilter("returned")}
      >
        <span className={`${styles.statDot} ${styles.dotReturned}`} />
        {stats.returned} Returned
      </div>
    )}
  </div>
)}

        {filteredOrders.length === 0 ? (
  <div className={styles.emptyState}>
    <div className={styles.emptyIcon}>🔍</div>
    <p>No orders match your filters.</p>
  </div>
) : (
  <SellerOrderCard orders={filteredOrders} page={page} />
)}
        {totalPages > 1 && <OrderPagination totalPages={totalPages} />}
      </div>
    </div>
  );
}
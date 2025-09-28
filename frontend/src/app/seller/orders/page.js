"use client";

import { useEffect, useState } from "react";
import { auth } from "../../../../firebase/config";
import styles from "../styles/SellerOrdersPage.module.css";

// ✅ Components
import OrderCard from "../../../../components/SellerOrderCard";
import OrderPagination from "../../../../components/OrderPagination";

import { useSearchParams } from "next/navigation";

export default function SellerOrdersPage() {
  const params = useSearchParams();
  const page = parseInt(params.get("page") || "1", 10); // get page from URL

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  // ✅ Fetch orders whenever the URL page changes
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        const queryParams = new URLSearchParams({ page });

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/seller/orders?${queryParams.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

        const data = await res.json();

        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("❌ Fetch orders error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page]);

  if (loading) return <p className={styles.message}>Loading your orders...</p>;
  if (error)
    return <p className={`${styles.message} ${styles.error}`}>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Orders for My Store</h1>

      {/* ✅ Orders List */}
      {orders.length === 0 ? (
        <p className={styles.message}>No orders found for your store yet.</p>
      ) : (
        <div className={styles.orderList}>
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}

      {/* ✅ Pagination */}
      {totalPages > 1 && <OrderPagination totalPages={totalPages} />}
    </div>
  );
}

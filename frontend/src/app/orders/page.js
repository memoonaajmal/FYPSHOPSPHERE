"use client";

import { useEffect, useState } from "react";
import { auth } from "../../../firebase/config";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";

import styles from "../../styles/Orders.module.css";
import UserOrderCard from "../../../components/UserOrderCard";
import OrderPagination from "../../../components/OrderPagination";

export default function UserOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  const router = useRouter();
  const params = useSearchParams();
  const page = parseInt(params.get("page") || "1", 10);
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  // ✅ Fetch user's orders
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

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
        console.error("❌ Fetch user orders error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, BASE_URL, page]);

  if (loading) return <p className={styles.message}>Loading your orders...</p>;
  if (error) return <p className={`${styles.message} ${styles.error}`}>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Orders</h1>

      {/* Info text under title */}
      <div className={styles.tableInfo}>
        Here you can track your order history and payment status.
        {"\n"}
        Click “View Details” to see more about each order.
      </div>

      {/* ✅ Orders Table Component */}
      {orders.length === 0 ? (
        <p className={styles.message}>No previous orders found.</p>
      ) : (
        <UserOrderCard orders={orders} page={page} />
      )}

      {/* ✅ Pagination */}
      {totalPages > 1 && <OrderPagination totalPages={totalPages} />}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { auth } from "../../../firebase/config";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";

import styles from "../../styles/Orders.module.css";
import UserOrderCard from "../../../components/UserOrderCard";
import OrderPagination from "../../../components/OrderPagination";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const params = useSearchParams();
  const page = parseInt(params.get("page") || "1", 10);
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        const token = await getIdToken(currentUser);
        const res = await fetch(`${BASE_URL}/api/orders?page=${page}&limit=5`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch orders");
        }

        const data = await res.json();
        setOrders(data.orders || []);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, BASE_URL, page]);

  if (loading) return <p style={{ padding: 20 }}>Loading your orders…</p>;
  if (error) return <p style={{ padding: 20, color: "red" }}>{error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>My Orders</h1>

      {orders.length === 0 ? (
        <p className={styles.noOrders}>No previous orders found.</p>
      ) : (
        <>
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <div key={order._id} className={styles.orderWrapper}>
                <UserOrderCard order={order} />
              </div>
            ))}
          </div>

          {/* ✅ Add pagination here */}
          <OrderPagination totalPages={totalPages} />
        </>
      )}
    </div>
  );
}

// app/orders/page.js
"use client";
import styles from "../../styles/Orders.module.css";
import { useEffect, useState } from "react";
import { auth } from "../../../firebase/config";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import { useRouter } from "next/navigation";



export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      try {
         const token = await getIdToken(currentUser);
         const res = await fetch(`${BASE_URL}/api/orders`, {
         headers: { Authorization: `Bearer ${token}` }
         });


        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error('Failed to fetch orders');
        }
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <p style={{ padding: 20 }}>Loading your orders…</p>;
  if (error) return <p style={{ padding: 20, color: "red" }}>{error}</p>;

return (
  <div className={styles.container}>
    <h1 className={styles.heading}>My Orders</h1>

    {orders.length === 0 ? (
      <p className={styles.noOrders}>No previous orders found.</p>
    ) : (
      <div className={styles.ordersGrid}>
        {orders.map((order) => (
          <div key={order._id} className={styles.orderCard}>
            <p><strong>Order ID:</strong> {order._id}</p>
            <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
            <p><strong>Grand Total:</strong> PKR  {order.grandTotal ?? order.totalAmount ?? '0'}</p>
            <p><strong>Items:</strong> {order.items?.length ?? 0}</p>
            <div className={styles.buttonGroup}>
              <button
                onClick={() => router.push(`/orders/${order._id}`)}
                className={styles.viewButton}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

}

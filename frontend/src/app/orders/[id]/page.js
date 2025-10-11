"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth } from "../../../../firebase/config";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import styles from "../../../styles/OrderDetails.module.css";

export default function UserOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Fetch user’s order details
  useEffect(() => {
    if (!id) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        const token = await getIdToken(user);
        const res = await fetch(`${BASE_URL}/api/orders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (res.status === 401) router.push("/login");
          else if (res.status === 403) setError("You are not allowed to view this order.");
          else if (res.status === 404) setError("Order not found.");
          else setError("Failed to load order.");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error("❌ Error fetching order:", err);
        setError("Failed to load order.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id, router, BASE_URL]);

  if (loading) return <p className={styles.message}>Loading order details...</p>;
  if (error) return <p className={`${styles.message} ${styles.error}`}>{error}</p>;
  if (!order) return <p className={styles.message}>Order not found.</p>;

  return (
    <div className={styles.pageWrapper}>
      {/* Header Section */}
      <div className={styles.header}>
        <div>
          <h1>Order #{order._id.slice(-4)}</h1>
          <div className={styles.headerMeta}>
            <span className={`${styles.badge} ${styles[order.paymentStatus?.toLowerCase()]}`}>
              {order.paymentStatus}
            </span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className={styles.content}>
        {/* LEFT COLUMN */}
        <div className={styles.leftColumn}>
          <div className={styles.card}>
            <h3>Your Items</h3>
            {order.items.map((item, i) => (
              <div key={i} className={styles.itemCard}>
                <img src={item.image} alt={item.name} />
                <div>
                  <p className={styles.itemName}>{item.name}</p>
                  <p className={styles.itemMeta}>Qty: {item.quantity}</p>
                  <p className={styles.itemPrice}>PKR {item.price}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <h3>Payment Summary</h3>
            <p>Subtotal: PKR {order.itemsTotal}</p>
            <p>Delivery: PKR {order.shippingFee}</p>
            <div className={styles.divider}></div>
            <p><strong>Total: PKR {order.grandTotal}</strong></p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className={styles.rightColumn}>
          <div className={styles.card}>
            {/* ✅ New Tracking ID section */}
            <div className={styles.infoSection}>
              <h3>Tracking ID</h3>
              <p><strong>{order.trackingId}</strong></p>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.infoSection}>
              <h3>Customer</h3>
              <p>Name: {order.firstName} {order.lastName}</p>
              <p>Email: {order.email}</p>
              <p>Contact #: {order.phone}</p>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.infoSection}>
              <h3>Shipping Address</h3>
              <p>{order.houseAddress}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

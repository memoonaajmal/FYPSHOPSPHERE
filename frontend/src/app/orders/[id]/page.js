"use client";
import styles from "../../../styles/OrderDetails.module.css";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth } from "../../../../firebase/config";
import { onAuthStateChanged, getIdToken } from "firebase/auth";

export default function OrderDetailsPage() {
  const { id } = useParams(); // this gives the order ID from /orders/[id]
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      try {
           const token = await getIdToken(user);
           const res = await fetch(`${BASE_URL}/api/orders/${id}`, {
           headers: { Authorization: `Bearer ${token}` }
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
        console.error(err);
        setError("Failed to load order.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id, router]);

  if (loading) return <p style={{ padding: 20 }}>Loading order…</p>;
  if (error) return <p style={{ padding: 20, color: "red" }}>{error}</p>;
  if (!order) return null;

  return (
  <div className={styles.container}>
    <button onClick={() => router.back()} className={styles.backButton}>← Back</button>
    <h2 className={styles.heading}>Order Details</h2>

    <div className={styles.section}>
      <p><strong>Order ID:</strong> {order._id}</p>
      <p><strong>Tracking ID:</strong> {order.trackingId}</p>
      <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
      <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
      <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
      <p><strong>Grand Total:</strong> PKR  {order.grandTotal}</p>
    </div>

    <div className={styles.section}>
      <h3>Shipping</h3>
      <p>{order.firstName} {order.lastName}</p>
      <p>{order.houseAddress}</p>
      <p>{order.phone}</p>
      <p>{order.email}</p>
    </div>

    <div className={styles.section}>
      <h3>Items</h3>
      <ul className={styles.itemsList}>
        {order.items.map((item, i) => (
          <li key={i} className={styles.item}>
            <span className={styles.itemName}>{item.name}</span> — 
            <span className={styles.itemQty}> qty: {item.quantity}</span> — 
            <span className={styles.itemPrice}> PKR  {item.price}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

}

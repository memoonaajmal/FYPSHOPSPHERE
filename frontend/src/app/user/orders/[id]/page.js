"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth } from "../../../../../firebase/config";
import { onAuthStateChanged, getIdToken } from "firebase/auth";
import styles from "../../../../styles/OrderDetails.module.css";

export default function UserOrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }

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
        setError("Failed to load order.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [id, router, BASE_URL]);

  if (loading) return <p className={styles.message}>Loading order details...</p>;
  if (error)   return <p className={`${styles.message} ${styles.error}`}>{error}</p>;
  if (!order)  return <p className={styles.message}>Order not found.</p>;

  const status = order.paymentStatus?.toLowerCase();

  return (
    <div className={styles.dashboard}>

      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.headerInner}>

          {/* Left: title + tracking */}
          <div className={styles.headerLeft}>
            <h1 className={styles.titleWithArrow}>
              <span className={styles.backArrow} onClick={() => router.back()}>←</span>
              Order Details
            </h1>
            <div className={styles.orderNumber}>{order.trackingId}</div>
          </div>

        </div>
      </div>

      {/* CONTENT */}
      <div className={styles.content}>
        <div className={styles.grid}>

          {/* ORDER HERO */}
          <div className={`${styles.card} ${styles.gridFull}`}>
            <div className={styles.storeHero}>
              <div>
                <div className={styles.storeName}>Order #{order._id.slice(-4)}</div>
                <div className={styles.storeSub}>
                  {new Date(order.createdAt).toLocaleString()}
                </div>
              </div>
              <span className={`${styles.badge} ${styles[status]}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>

          {/* ORDER ITEMS */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>📦</div>
              <h3 className={styles.cardTitle}>Order Items</h3>
            </div>
            <div className={styles.cardBody}>
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
          </div>

          {/* PAYMENT SUMMARY */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>💳</div>
              <h3 className={styles.cardTitle}>Payment Summary</h3>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Subtotal</span>
                <span className={styles.infoValue}>PKR {order.itemsTotal}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Delivery</span>
                <span className={styles.infoValue}>PKR {order.shippingFee}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Total</span>
                <span className={styles.infoValue}>PKR {order.grandTotal}</span>
              </div>
            </div>
          </div>

          {/* CUSTOMER INFO */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>👤</div>
              <h3 className={styles.cardTitle}>Customer</h3>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Name</span>
                <span className={styles.infoValue}>
                  {order.firstName} {order.lastName}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email</span>
                <span className={styles.infoValue}>{order.email}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Phone</span>
                <span className={styles.infoValue}>{order.phone}</span>
              </div>
            </div>
          </div>

          {/* SHIPPING ADDRESS */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>📍</div>
              <h3 className={styles.cardTitle}>Shipping Address</h3>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Address</span>
                <span className={styles.infoValue}>{order.houseAddress}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Tracking ID</span>
                <span className={styles.infoValue}>{order.trackingId}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
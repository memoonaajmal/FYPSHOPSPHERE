"use client";
import { useEffect, useState } from "react";
import { auth } from "../../../../firebase/config";
import styles from "../styles/SellerOrdersPage.module.css";

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Not logged in");
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/seller/orders`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${await res.text()}`);
        }

        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("❌ Fetch orders error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) return <p className={styles.message}>Loading your orders...</p>;
  if (error) return <p className={`${styles.message} ${styles.error}`}>Error: {error}</p>;

  // ✅ Function to assign badge style based on status
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "paid":
        return styles.statusPaid;
      case "pending":
        return styles.statusPending;
      case "failed":
      case "cancelled":
        return styles.statusFailed;
      default:
        return styles.statusDefault;
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Orders for My Store</h1>
      {orders.length === 0 ? (
        <p className={styles.message}>No orders found for your store yet.</p>
      ) : (
        <ul className={styles.orderList}>
          {orders.map((order) => (
            <li key={order._id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div>
                  <p className={styles.customerName}>
                    {order.firstName} {order.lastName}
                  </p>
                  <p className={styles.customerInfo}>
                    {order.email} | {order.phone}
                  </p>
                  <p className={styles.customerInfo}>
                    Address: {order.houseAddress}
                  </p>
                </div>
                <div className={styles.orderMeta}>
                  <p className={styles.orderTotal}>
                    Order Total: <span>${order.grandTotal}</span>
                  </p>
                  <span className={`${styles.statusBadge} ${getStatusClass(order.paymentStatus)}`}>
                    {order.paymentStatus}
                  </span>
                  {order.trackingId && (
                    <p className={styles.trackingId}>
                      Tracking: {order.trackingId}
                    </p>
                  )}
                  <p className={styles.timestamp}>
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <ul className={styles.itemList}>
                {order.items.map((item, idx) => (
                  <li key={idx} className={styles.item}>
                    <span>{item.name}</span>
                    <span>
                      {item.quantity} × ${item.price} = $
                      {item.price * item.quantity}
                    </span>
                  </li>
                ))}
              </ul>

              <p className={styles.sellerTotal}>
                Seller Items Total: ${order.itemsTotal}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

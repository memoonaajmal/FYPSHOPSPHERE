"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth } from "../../../../../firebase/config";
import styles from "../../styles/OrderDetailsPage.module.css";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [order, setOrder] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // ✅ Fetch seller store ID
  useEffect(() => {
    const fetchStoreId = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/seller/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setStoreId(data.storeId);
        }
      } catch (err) {
        console.error("Error fetching store ID:", err);
      }
    };
    fetchStoreId();
  }, []);

  // ✅ Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!storeId || !id) return;
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/seller/orders/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) throw new Error("Failed to fetch order details");
        const orderData = await res.json();

        const myItems = orderData?.items?.filter((it) => it.storeId === storeId) || [];
        let myPaymentStatus = "pending";
        if (myItems.length > 0) {
          if (myItems.every((it) => it.itemPaymentStatus === "paid")) myPaymentStatus = "paid";
          else if (myItems.every((it) => it.itemPaymentStatus === "returned")) myPaymentStatus = "returned";
        } else myPaymentStatus = orderData.paymentStatus;

        setStatus(myPaymentStatus);
        setOrder(orderData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id, storeId]);

  const handleStatusUpdate = async (newStatus) => {
    try {
      setStatusLoading(true);
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/seller/orders/${order._id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ storeId, status: newStatus }),
        }
      );
      if (!res.ok) throw new Error("Failed to update payment status");
      const data = await res.json();
      setStatus(data.myPaymentStatus || data.paymentStatus);
      setDropdownOpen(false);
    } catch {
      alert("❌ Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) return <p className={styles.message}>Loading order details...</p>;
  if (error) return <p className={`${styles.message} ${styles.error}`}>❌ {error}</p>;
  if (!order) return <p className={styles.message}>Order not found.</p>;

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.header}>
        <div>
          <h1>Order #{order._id.slice(-4)}</h1>
          <div className={styles.headerMeta}>
            <span className={`${styles.badge} ${styles[status?.toLowerCase()]}`}>
              {status}
            </span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {/* ✅ Only show dropdown when payment is pending */}
        {status === "pending" && (
          <div className={styles.actions}>
            <div className={styles.dropdown}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={styles.dropdownBtn}
                disabled={statusLoading}
              >
                {statusLoading ? "Updating..." : "Update Status"}
              </button>
              {dropdownOpen && (
                <div className={styles.dropdownMenu}>
                  <button onClick={() => handleStatusUpdate("paid")}>Mark as Paid</button>
                  <button onClick={() => handleStatusUpdate("returned")}>Mark as Returned</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className={styles.content}>
        {/* LEFT COLUMN */}
        <div className={styles.leftColumn}>
          <div className={styles.card}>
            <h3>
              {status === "paid"
                ? "Fulfilled"
                : status === "returned"
                ? "Returned"
                : "Unfulfilled"}
            </h3>
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

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

  //  Fetch seller store ID
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

  //  Fetch order details
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
      alert(" Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) return <p className={styles.message}>Loading order details...</p>;
  if (error) return <p className={`${styles.message} ${styles.error}`}>❌ {error}</p>;
  if (!order) return <p className={styles.message}>Order not found.</p>;

  return (
  <div className={styles.dashboard}>
    
    {/* HEADER */}
<div className={styles.header}>
  <div className={styles.headerInner}>

    {/* Left: title + order number */}
    <div className={styles.headerLeft}>
      <h1 className={styles.titleWithArrow}>
        <span className={styles.backArrow} onClick={() => router.back()}>←</span>
        Order Details
      </h1>
      <div className={styles.orderNumber}>{order.trackingId}</div>
    </div>

    {/* Right: Update Status button */}
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
</div>

    {/* CONTENT */}
    <div className={styles.content}>
      <div className={styles.grid}>

        {/* ORDER HERO */}
        <div className={`${styles.card} ${styles.gridFull}`}>
          <div className={styles.storeHero}>
            

            <div>
              <div className={styles.storeName}>
                Order #{order._id.slice(-4)}
              </div>
              <div className={styles.storeSub}>
                {new Date(order.createdAt).toLocaleString()}
              </div>
            </div>
            <span className={`${styles.badge} ${styles[status]}`}>
    {status}
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
              <span className={styles.infoValue}>
                {order.houseAddress}
              </span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Tracking ID</span>
              <span className={styles.infoValue}>
                {order.trackingId}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
);
}

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

  // ✅ 1. Fetch current seller's store ID
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
        } else {
          console.error("Failed to get store ID");
        }
      } catch (err) {
        console.error("Error fetching store ID:", err);
      }
    };

    fetchStoreId();
  }, []);

  // ✅ 2. Fetch order details (once storeId is available)
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

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to fetch order details");
        }

        // ✅ Backend returns order directly, not wrapped
        const orderData = await res.json();

        // ✅ Determine this seller's payment status
        const myItems = orderData?.items?.filter((it) => it.storeId === storeId) || [];
        let myPaymentStatus = "pending";
        if (myItems.length > 0) {
          if (myItems.every((it) => it.itemPaymentStatus === "paid")) {
            myPaymentStatus = "paid";
          } else if (myItems.every((it) => it.itemPaymentStatus === "returned")) {
            myPaymentStatus = "returned";
          }
        } else {
          myPaymentStatus = orderData.paymentStatus;
        }

        setStatus(myPaymentStatus);
        setOrder(orderData);
      } catch (err) {
        console.error("Fetch order error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, storeId]);

  // ✅ 3. Update payment status
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
    } catch (err) {
      console.error(err);
      alert("❌ Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  // ✅ 4. Render States
  if (loading) return <p className={styles.message}>Loading order details...</p>;
  if (error) return <p className={`${styles.message} ${styles.error}`}>❌ {error}</p>;
  if (!order) return <p className={styles.message}>Order not found.</p>;

  return (
    <div className={styles.container}>
      <button
        className={styles.backBtn}
        onClick={() => router.push("/seller/orders")}
      >
        ← Back to Orders
      </button>

      <h1 className={styles.title}>Order Details</h1>

      {/* 🧍 Customer Info */}
      <div className={styles.section}>
        <h2>Customer Information</h2>
        <p><strong>Name:</strong> {order.firstName} {order.lastName}</p>
        <p><strong>Email:</strong> {order.email}</p>
        <p><strong>Phone:</strong> {order.phone}</p>
        <p><strong>Address:</strong> {order.houseAddress}</p>
      </div>

      {/* 📦 Order Info */}
      <div className={styles.section}>
        <h2>Order Info</h2>
        <p><strong>Order ID:</strong> {order._id}</p>
        {order.trackingId && <p><strong>Tracking ID:</strong> {order.trackingId}</p>}
        <p><strong>Placed On:</strong> {new Date(order.createdAt).toLocaleString()}</p>
        <p>
          <strong>Payment Status:</strong>
          <span className={`${styles.statusBadge} ${styles[status?.toLowerCase()]}`}>
            {status}
          </span>
        </p>
      </div>

      {/* 🛒 Items */}
      <div className={styles.section}>
        <h2>Items</h2>
        <ul className={styles.itemList}>
          {order?.items?.length > 0 ? (
            order.items.map((item, i) => (
              <li key={i} className={styles.item}>
                {item.image && <img src={item.image} alt={item.name} />}
                <div>
                  <p><strong>{item.name}</strong></p>
                  <p>{item.quantity} × ${item.price} = ${item.quantity * item.price}</p>
                </div>
              </li>
            ))
          ) : (
            <p>No items found for this store.</p>
          )}
        </ul>
      </div>

      {/* 💰 Totals */}
      <div className={styles.section}>
        <h2>Totals</h2>
        <p>Items Total: ${order.itemsTotal || 0}</p>
        <p>Shipping Fee: ${order.shippingFee || 0}</p>
        <p className={styles.grandTotal}>
          Grand Total: ${order.grandTotal || order.itemsTotal || 0}
        </p>
      </div>

      {/* ✅ Status Update Buttons */}
      {status !== "paid" && status !== "returned" && (
        <div className={styles.buttonRow}>
          <button
            className={styles.markPaidBtn}
            onClick={() => handleStatusUpdate("paid")}
            disabled={statusLoading}
          >
            {statusLoading ? "Updating..." : "Mark as Paid"}
          </button>

          <button
            className={styles.returnBtn}
            onClick={() => handleStatusUpdate("returned")}
            disabled={statusLoading}
          >
            {statusLoading ? "Updating..." : "Mark as Returned"}
          </button>
        </div>
      )}
    </div>
  );
}

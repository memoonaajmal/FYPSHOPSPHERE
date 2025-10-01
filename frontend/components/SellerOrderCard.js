'use client';
import { useState } from 'react';
import styles from './styles/SellerOrderCard.module.css';
import { auth } from "../firebase/config";

export default function OrderCard({ order, storeId, onStatusUpdated }) {
  const [status, setStatus] = useState(order.myPaymentStatus || order.paymentStatus);
  const [loading, setLoading] = useState(false);

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return styles.statusPaid;
      case 'returned':
        return styles.statusReturned;
      case 'pending':
        return styles.statusPending;
      default:
        return styles.statusDefault;
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setLoading(true);

      const token = await auth.currentUser.getIdToken();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/seller/orders/${order._id}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ storeId, status: newStatus }),
        }
      );

      if (!res.ok) throw new Error('Failed to update status');

      const data = await res.json();
      setStatus(data.myPaymentStatus || data.paymentStatus);
      onStatusUpdated?.();
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.orderCard}>
      <div className={styles.orderHeader}>
        <div>
          <p className={styles.customerName}>
            {order.firstName} {order.lastName}
          </p>
          <p className={styles.customerInfo}>
            {order.email} | {order.phone}
          </p>
          <p className={styles.customerInfo}>Address: {order.houseAddress}</p>
        </div>
        <div className={styles.orderMeta}>
          <p className={styles.orderTotal}>
            Total: <span>${order.grandTotal}</span>
          </p>

          <span className={`${styles.statusBadge} ${getStatusClass(status)}`}>
            {status}
          </span>

          {order.trackingId && (
            <p className={styles.trackingId}>Tracking: {order.trackingId}</p>
          )}
          <p className={styles.timestamp}>
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <ul className={styles.itemList}>
        {order.items.map((item, idx) => (
          <li key={idx} className={styles.item}>
            {item.image && <img src={item.image} alt={item.name} />}
            <span>{item.name}</span>
            <span>
              {item.quantity} × ${item.price} = ${item.price * item.quantity}
            </span>
          </li>
        ))}
      </ul>

      <div className={styles.totals}>
        <p>Items Total: ${order.itemsTotal}</p>
        <p>Shipping Fee: ${order.shippingFee}</p>
        <p className={styles.grandTotal}>Grand Total: ${order.grandTotal}</p>
      </div>

      {status !== 'paid' && status !== 'returned' && (
        <div className={styles.buttonRow}>
          <button
            className={styles.markPaidBtn}
            onClick={() => handleStatusUpdate("paid")}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Mark as Paid'}
          </button>

          <button
            className={styles.returnBtn}
            onClick={() => handleStatusUpdate("returned")}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Mark as Returned'}
          </button>
        </div>
      )}
    </div>
  );
}

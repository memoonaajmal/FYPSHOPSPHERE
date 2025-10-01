'use client';
import { useState } from 'react';
import styles from './styles/SellerOrderCard.module.css';
import { auth } from "../firebase/config";

export default function OrderCard({ order, storeId, onStatusUpdated }) {
  // ✅ Initialize with seller-specific payment status
  const [status, setStatus] = useState(order.myPaymentStatus || order.paymentStatus);
  const [loading, setLoading] = useState(false);

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return styles.statusPaid;
      case 'pending':
        return styles.statusPending;
      case 'failed':
      case 'cancelled':
        return styles.statusFailed;
      default:
        return styles.statusDefault;
    }
  };

  // ✅ Seller updates *their part* of the payment
  const handleStatusUpdate = async () => {
    try {
      setLoading(true);

      const token = await auth.currentUser.getIdToken();

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/seller/orders/${order._id}/pay`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ storeId }),
        }
      );

      if (!res.ok) throw new Error('Failed to update payment status');

      const data = await res.json();

      // ✅ Update seller-specific status after response
      setStatus(data.myPaymentStatus || data.paymentStatus);

      onStatusUpdated?.();
    } catch (err) {
      console.error(err);
      alert('Failed to update payment status');
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

          {/* ✅ Seller-specific badge */}
          <span className={`${styles.statusBadge} ${getStatusClass(status)}`}>
            {status}
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

      {/* ✅ Show "Mark as Paid" only if *seller-specific* status is pending */}
      {status !== 'paid' && (
        <button
          className={styles.markPaidBtn}
          onClick={handleStatusUpdate}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Mark as Paid'}
        </button>
      )}
    </div>
  );
}

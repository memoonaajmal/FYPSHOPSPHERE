"use client";
import styles from "./styles/AdminOrderCard.module.css";

export default function AdminOrderCard({ order }) {
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return styles.statusPaid;
      case "pending":
        return styles.statusPending;
      case "returned":
        return styles.statusReturned;
      default:
        return styles.statusDefault;
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
            Total: <span>PKR {order.grandTotal}</span>
          </p>
          <span className={`${styles.statusBadge} ${getStatusClass(order.paymentStatus)}`}>
            {order.paymentStatus}
          </span>
          {order.trackingId && (
            <p className={styles.trackingId}>Tracking: {order.trackingId}</p>
          )}
          <p className={styles.timestamp}>
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Items */}
      {order.items?.length > 0 && (
        <ul className={styles.itemList}>
          {order.items.map((item, idx) => (
            <li key={idx} className={styles.item}>
              {item.image && <img src={item.image} alt={item.name} />}
              <span>{item.name}</span>
              <span>
                {item.quantity} × PKR {item.price} = PKR {item.price * item.quantity}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Totals */}
      <div className={styles.totals}>
        <p>Items Total: PKR {order.itemsTotal}</p>
        <p>Shipping Fee: PKR {order.shippingFee}</p>
        <p className={styles.grandTotal}>Grand Total: PKR {order.grandTotal}</p>
      </div>
    </div>
  );
}

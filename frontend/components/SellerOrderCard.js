"use client";
import styles from "./styles/SellerOrderCard.module.css";
import { useRouter } from "next/navigation";

function getStatusClass(status, styles) {
  switch (status?.toLowerCase()) {
    case "paid":
      return styles.badgeApproved;
    case "returned":
      return styles.badgeRejected;
    case "pending":
    default:
      return styles.badgePending;
  }
}

export default function SellerOrderCard({ orders, page = 1 }) {
  const router = useRouter();

  return (
    <div className={styles.tablePanel}>
      {/* Header */}
      <div className={styles.tableHeader}>
  <div>#</div>
  <div>Tracking ID</div>
  <div>Email</div>
  <div>Status</div>
  <div />
</div>

      {/* Rows */}
      {orders.map((order, index) => {
        const status = order.myPaymentStatus || order.paymentStatus;

        return (
          <div
  key={order._id}
  className={styles.tableRow}
  onClick={() => router.push(`/seller/orders/${order._id}`)}
>
  {/* # */}
  <div className={styles.indexCell}>
    {index + 1 + (page - 1) * 10}
  </div>

  {/* Tracking ID */}
  <div className={styles.trackingId}>
    {order.trackingId || "—"}
  </div>

  {/* Email */}
  <div className={styles.email}>
    {order.email}
  </div>

  {/* Status */}
  <div>
    <span
      className={`${styles.badge} ${getStatusClass(status, styles)}`}
    >
      {status}
    </span>
  </div>

  {/* Arrow */}
  <div
    className={styles.arrowCell}
    onClick={(e) => {
      e.stopPropagation();
      router.push(`/seller/orders/${order._id}`);
    }}
  >
    ›
  </div>
</div>
        );
      })}
    </div>
  );
}
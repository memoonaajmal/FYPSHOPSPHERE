"use client";
import styles from "./styles/UserOrderCard.module.css";
import { useRouter } from "next/navigation";

function getStatusClass(status, styles) {
  switch (status?.toLowerCase()) {
    case "paid":     return styles.badgeApproved;
    case "returned": return styles.badgeRejected;
    case "pending":
    default:         return styles.badgePending;
  }
}

export default function UserOrderCard({ orders, page = 1 }) {
  const router = useRouter();

  return (
    <div className={styles.tablePanel}>

      {/* Header */}
      <div className={styles.tableHeader}>
        <div>#</div>
        <div>Tracking ID</div>
        <div>Amount</div>
        <div>Status</div>
        <div />
      </div>

      {/* Rows */}
      {orders?.map((order, index) => {
        const status = order.paymentStatus || "pending";
        return (
          <div
            key={order._id}
            className={styles.tableRow}
            onClick={() => router.push(`/user/orders/${order._id}`)}
          >
            {/* # */}
            <div className={styles.indexCell}>
              {index + 1 + (page - 1) * 10}
            </div>

            {/* Tracking ID */}
            <div className={styles.trackingId}>
              {order.trackingId || "—"}
              <span className={styles.subText}>
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Amount */}
            <div className={styles.amount}>
              PKR {order.grandTotal}
              <span className={styles.subText}>
                {order.items?.length || 0} items
              </span>
            </div>

            {/* Status */}
            <div>
              <span className={`${styles.badge} ${getStatusClass(status, styles)}`}>
                {status}
              </span>
            </div>

            {/* Arrow */}
            <div
              className={styles.arrowCell}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/user/orders/${order._id}`);
              }}
            >
              ›
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {(!orders || orders.length === 0) && (
        <div className={styles.emptyMsg}>No orders found.</div>
      )}

    </div>
  );
}
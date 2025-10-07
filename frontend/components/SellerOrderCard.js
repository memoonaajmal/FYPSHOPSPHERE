"use client";
import styles from "./styles/SellerOrderCard.module.css";
import { useRouter } from "next/navigation";

export default function SellerOrderCard({ orders, page = 1 }) {
  const router = useRouter();

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.ordersTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>Email / Tracking ID</th>
            <th>Payment Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => (
            <tr key={order._id}>
              <td>{index + 1 + (page - 1) * 10}</td>
              <td>
                <strong>{order.email}</strong>
                <br />
                {order.trackingId && (
                  <small className={styles.trackingId}>{order.trackingId}</small>
                )}
              </td>
              <td>
                <span
                  className={`${styles.statusBadge} ${
                    styles[order.myPaymentStatus?.toLowerCase()] ||
                    styles[order.paymentStatus?.toLowerCase()] ||
                    styles.pending
                  }`}
                >
                  {order.myPaymentStatus || order.paymentStatus}
                </span>
              </td>
              <td>
                <button
                  className={styles.viewBtn}
                  onClick={() =>
                    router.push(`/seller/orders/${order._id}`)
                  }
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

"use client";
import styles from "./styles/UserOrderCard.module.css";
import { useRouter } from "next/navigation";

export default function UserOrderCard({ orders, page = 1 }) {
  const router = useRouter();

  const getStatusClass = (status) => {
    if (!status) return styles.pending;
    const normalized = status.toLowerCase();
    if (normalized === "paid") return styles.paid;
    if (normalized === "pending") return styles.pending;
    if (normalized === "returned") return styles.returned;
    return styles.default;
  };

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.ordersTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>Order Info</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders?.map((order, index) => (
            <tr key={order._id}>
              <td>{index + 1 + (page - 1) * 10}</td>
              <td>
                <strong>Tracking ID:</strong>{" "}
                {order.trackingId || "N/A"}
                <br />
                <small>{new Date(order.createdAt).toLocaleString()}</small>
              </td>
              <td>
                <strong>PKR {order.grandTotal}</strong>
                <br />
                <small>{order.items?.length || 0} items</small>
              </td>
              <td>
                <span className={`${styles.statusBadge} ${getStatusClass(order.paymentStatus)}`}>
                  {order.paymentStatus || "Pending"}
                </span>
              </td>
              <td>
                <button
                  className={styles.viewBtn}
                  onClick={() => router.push(`orders/${order._id}`)}
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}

          {(!orders || orders.length === 0) && (
            <tr>
              <td colSpan="5" className={styles.emptyMsg}>
                No orders found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

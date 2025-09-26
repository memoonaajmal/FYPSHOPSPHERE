"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import UserDetails from "../../../../../components/UserDetails";
import styles from "../../styles/UserDetails.module.css";

export default function UserDetailsPage() {
  const { id: userId } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // ✅ Fetch single user
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users/${userId}`,
          { credentials: "include" }
        );

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        setUser(data);

        // ✅ Now fetch this user's orders by email
        if (data?.email) {
          const ordersRes = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/email/${data.email}`,
            { credentials: "include" }
          );

          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            // always set an array
            setOrders(Array.isArray(ordersData) ? ordersData : []);
          } else {
            console.error("Failed to fetch user orders");
            setOrders([]); // fallback
          }
        } else {
          setOrders([]); // no email, no orders
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        setOrders([]); // fallback
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchUser();
  }, [userId]);

  // ✅ Delete user
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to delete user: ${res.status} - ${errorText}`);
      }

      alert("✅ User deleted successfully!");
      router.push("/admin/users");
    } catch (err) {
      console.error("❌ Error deleting user:", err);
      alert("Failed to delete user. Check console for details.");
    }
  };

  if (!user) return <p style={{ padding: "24px" }}>Loading user details...</p>;

  return (
    <div className={styles.container}>
      <UserDetails user={user} />

      <button
        onClick={handleDelete}
        className={`${styles.button} ${styles.btnDanger}`}
      >
        Delete User
      </button>

      {/* ✅ Orders Section */}
      <div style={{ marginTop: "30px" }}>
        <h2 className={styles.sectionTitle}>Previous Orders</h2>

        {loadingOrders ? (
          <p>Loading orders...</p>
        ) : orders.length > 0 ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th>Order ID</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody className={styles.tbody}>
                {orders.map((order) => (
                  <tr key={order._id} className={styles.rowHover}>
                    <td>{order._id}</td>
                    <td>{order.grandTotal}</td>
                    <td>{order.paymentStatus}</td>
                    <td>{order.paymentMethod}</td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No previous orders</p>
        )}
      </div>
    </div>
  );
}

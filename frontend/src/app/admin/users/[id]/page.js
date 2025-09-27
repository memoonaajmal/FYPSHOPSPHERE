"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // ✅ import
import UserDetails from "../../../../../components/UserDetails";
import styles from "../../styles/UserDetails.module.css";

export default function UserDetailsPage() {
  const { id: userId } = useParams();
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // ✅ Watch Firebase Auth state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Helper: fetch with Firebase token
  const fetchWithAuth = async (url, options = {}) => {
    if (!firebaseUser) throw new Error("User not logged in");
    const token = await firebaseUser.getIdToken();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  };

  // ✅ Fetch single user + orders (only once firebaseUser is ready)
  useEffect(() => {
    if (!userId || !firebaseUser) return;

    const fetchUser = async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users/${userId}`
        );
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setUser(data);

        let ordersRes;
        if (Array.isArray(data.roles) && data.roles.includes("seller")) {
          ordersRes = await fetchWithAuth(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/orders?sellerId=${data._id}`
          );
        } else if (data?.email) {
          ordersRes = await fetchWithAuth(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/email/${data.email}`
          );
        }

        if (ordersRes?.ok) {
          const ordersData = await ordersRes.json();
          setOrders(Array.isArray(ordersData) ? ordersData : []);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchUser();
  }, [userId, firebaseUser]);

  // ✅ Delete user
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users/${userId}`,
        { method: "DELETE" }
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

  if (!firebaseUser) {
    return <p style={{ padding: "24px" }}>🔑 Waiting for login...</p>;
  }

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
                    <td>{order.itemsTotal || order.grandTotal}</td>
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

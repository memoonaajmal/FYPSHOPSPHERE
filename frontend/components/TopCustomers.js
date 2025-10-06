"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import styles from "./styles/TopCustomers.module.css";

export default function TopCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return setLoading(false);

      try {
        const token = await user.getIdToken();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics/top-customers`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
        setCustomers(res.data.topCustomers || []);
      } catch (err) {
        console.error("Error fetching top customers:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading top customers...</p>;
  if (!customers.length) return <p>No customers found yet.</p>;

  return (
    <div className={styles.topCustomers}>
      <h3>Top 5 Customers</h3>
      <ul>
        {customers.map((c, i) => (
          <li key={i} className={styles.customerCard}>
            <div>
              <h4>{c.user.name || "Unnamed User"}</h4>
              <p>{c.user.email}</p>
            </div>
            <div className={styles.stats}>
              <p><strong>{c.totalOrders}</strong> orders</p>
              <p><strong>PKR {c.totalSpent.toFixed(0)}</strong> spent</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

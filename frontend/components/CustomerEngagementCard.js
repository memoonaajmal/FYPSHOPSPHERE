"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import styles from "./styles/CustomerEngagementCard.module.css";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// import icons from react-icons
import { FaUsers, FaUserCheck, FaShoppingBag, FaCrown } from "react-icons/fa";

export default function CustomerEngagementCard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return setLoading(false);

      try {
        const token = await user.getIdToken();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics/customer-summary`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setSummary(res.data.summary);
      } catch (err) {
        console.error("Customer summary error:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p className={styles.loading}>Loading...</p>;
  if (!summary)
    return <p className={styles.empty}>No customer data available yet.</p>;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Customer Engagement</h3>

      <div className={styles.stat}>
        <div className={styles.iconLabel}>
          <FaUsers className={styles.icon} />
          <span>Unique Customers</span>
        </div>
        <strong>{summary.uniqueCustomers}</strong>
      </div>

      <div className={styles.stat}>
        <div className={styles.iconLabel}>
          <FaUserCheck className={styles.icon} />
          <span>Repeat Customers</span>
        </div>
        <strong>{summary.repeatCustomers}</strong>
      </div>

      <div className={styles.stat}>
        <div className={styles.iconLabel}>
          <FaShoppingBag className={styles.icon} />
          <span>Avg Order Value</span>
        </div>
        <strong>PKR {summary.avgOrderValue}</strong>
      </div>

      <div className={styles.stat}>
        <div className={styles.iconLabel}>
          <FaCrown className={styles.icon} />
          <span>Most Active Customer</span>
        </div>
        <strong>{summary.mostActive}</strong>
      </div>
    </div>
  );
}

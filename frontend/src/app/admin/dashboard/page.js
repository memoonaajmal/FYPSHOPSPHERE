"use client";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import Link from "next/link";
import styles from "../../../styles/AdminDashboard.module.css";

export default function AdminDashboard() {
  return (
    <ProtectedRoute role="admin">
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Admin Dashboard</h1>
    

        <div className={styles.grid}>
          {/* User Management Box */}
          <Link href="/admin/users">
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>User Management</h2>
              <p className={styles.cardText}>
                View and manage users, roles, and their order history.
              </p>
            </div>
          </Link>

          {/* Store Management Box */}
          <Link href="/admin/stores">
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Store Management</h2>
              <p className={styles.cardText}>
                Approve sellers, manage stores, and monitor their performance.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}

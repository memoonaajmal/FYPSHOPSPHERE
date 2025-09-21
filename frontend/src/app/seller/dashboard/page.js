// frontend/src/app/seller/dashboard/page.js
"use client";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import Link from "next/link";
import styles from "../../../styles/AdminDashboard.module.css";

export default function SellerDashboard() {
  return (
    <ProtectedRoute role="seller">
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Seller Dashboard</h1>

        <div className={styles.grid}>
          {/* My Products */}
          <Link href="/seller/products">
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>My Products</h2>
              <p className={styles.cardText}>
                Add, edit, or remove your products.
              </p>
            </div>
          </Link>

          {/* My Orders */}
          <Link href="/seller/orders">
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>My Orders</h2>
              <p className={styles.cardText}>
                View orders placed for your products.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import Link from "next/link";
import styles from "../styles/SellerDashboard.module.css";
import SellerProductCard from "../../../../components/SellerProductCard";
import TopCustomers from "../../../../components/TopCustomers";
import CustomerEngagementCard from "../../../../components/CustomerEngagementCard";
import {
  DollarSign,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import SalesBarChart from "../../../../components/SalesBarChart";

export default function SellerDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.error("No user logged in");
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics/dashboard`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load analytics:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <ProtectedRoute role="seller">
      <div className={styles.dashboard}>
        <h1 className={styles.title}>Seller Dashboard</h1>

        {/* ======= 🔗 Navigation Section (Top Buttons) ======= */}
        <div className={styles.grid}>
          <Link href="/seller/products">
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>My Products</h2>
              <p className={styles.cardText}>Manage, add, or update products</p>
            </div>
          </Link>

          <Link href="/seller/orders">
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>My Orders</h2>
              <p className={styles.cardText}>Track all placed orders easily</p>
            </div>
          </Link>
        </div>

        {/* ======= 📊 Business Overview ======= */}
        <div className={styles.analytics}>
          <h2 className={styles.sectionTitle}>Business Overview</h2>

          {loading ? (
            <p className={styles.loading}>Loading stats...</p>
          ) : stats ? (
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <DollarSign className={styles.icon} />
                  <div>
                    <h3>Total Revenue</h3>
                    <p className={styles.subText}>Your all-time earnings</p>
                  </div>
                </div>
                <p className={styles.statValue}>PKR {stats.totalRevenue}</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <ShoppingCart className={styles.icon} />
                  <div>
                    <h3>Total Orders</h3>
                    <p className={styles.subText}>All customer purchases</p>
                  </div>
                </div>
                <p className={styles.statValue}>{stats.totalOrders}</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <Clock className={styles.icon} />
                  <div>
                    <h3>Pending Orders</h3>
                    <p className={styles.subText}>Awaiting dispatch</p>
                  </div>
                </div>
                <p className={styles.statValue}>{stats.pendingOrders}</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <CheckCircle className={styles.icon} />
                  <div>
                    <h3>Delivered Orders</h3>
                    <p className={styles.subText}>Successfully completed</p>
                  </div>
                </div>
                <p className={styles.statValue}>{stats.deliveredOrders}</p>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <XCircle className={styles.icon} />
                  <div>
                    <h3>Returned Orders</h3>
                    <p className={styles.subText}>Refunded or returned</p>
                  </div>
                </div>
                <p className={styles.statValue}>{stats.cancelledOrders}</p>
              </div>
            </div>
          ) : (
            <p className={styles.error}>Unable to load analytics data.</p>
          )}
        </div>

        {/* ======= 📈 Sales Chart Section ======= */}
        <div className={styles.salesSection}>
          <SalesBarChart />
        </div>

        {/* ======= 🏆 Top Products Section ======= */}
        {stats?.topProducts?.length > 0 && (
          <div className={styles.topProducts}>
            <h3>Top 5 Bestsellers</h3>
            <div className={styles.scrollContainer}>
              <div className={styles.scrollContent}>
                {[...stats.topProducts, ...stats.topProducts].map(
                  (item, index) => (
                    <div key={index} className={styles.productCardWrapper}>
                      <SellerProductCard
                        product={item.product}
                        onDelete={() => {}}
                      />
                      <p className={styles.soldCount}>{item.sold} sold</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======= 👥 Customers Insights Section ======= */}
        <div className={styles.customersSection}>
          <div className={styles.leftSection}>
            <TopCustomers />
          </div>
          <div className={styles.rightSection}>
            <CustomerEngagementCard />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

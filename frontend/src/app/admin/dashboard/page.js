"use client";

import ProtectedRoute from "../../../../components/ProtectedRoute";
import Link from "next/link";
import styles from "../styles/AdminDashboard.module.css";
import app from "../../../../firebase/config";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

gsap.registerPlugin(ScrollTrigger);

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const auth = getAuth(app);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function AdminDashboard() {
  const dashboardRef = useRef(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalUsers: 0,
    activeStores: 0,
    pendingOrders: 0,
    salesData: [],
    storeSales: [],
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const token = await user.getIdToken();

        const analyticsRes = await fetch(`${BASE_URL}/api/admin/analytics`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!analyticsRes.ok) throw new Error(`Analytics error: ${analyticsRes.status}`);
        const analyticsData = await analyticsRes.json();

        // Filter salesData to only show months up to the current month
        const currentMonthIndex = new Date().getMonth(); // 0-indexed (Jan=0, Mar=2)
        const filteredSalesData = analyticsData.salesData?.filter(
          (entry) => MONTHS.indexOf(entry.month) <= currentMonthIndex
        ) || [];

        setStats({
          ...analyticsData,
          salesData: filteredSalesData,
        });

        const orderRes = await fetch(`${BASE_URL}/api/admin/recent-orders`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!orderRes.ok) throw new Error(`Order error: ${orderRes.status}`);
        const orderData = await orderRes.json();
        setRecentOrders(orderData.orders ? [orderData.orders] : []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(`.${styles.title}`, {
        y: -40, opacity: 0, duration: 0.8, ease: "power3.out",
      });
      gsap.from(`.${styles.card}`, {
        y: 50, opacity: 0, duration: 0.8, stagger: 0.2, ease: "power3.out",
        scrollTrigger: { trigger: `.${styles.grid}`, start: "top 85%" },
      });
    }, dashboardRef);
    return () => ctx.revert();
  }, []);

  if (loading) return <p className={styles.loading}>Loading analytics...</p>;

  return (
    <ProtectedRoute role="admin">
      <div ref={dashboardRef} className={styles.dashboard}>

        {/* ===== Dark Header Banner ===== */}
        <div className={styles.headerBanner}>
          <h1 className={styles.title}>Admin Dashboard</h1>
          <p className={styles.headerSub}>Platform overview and key metrics</p>

          {/* Summary Cards inside header */}
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.cardHeader}>
                <h4>Revenue Generated</h4>
                <span className={styles.icon}>💰</span>
              </div>
              <p className={styles.value}>${stats?.totalSales?.toLocaleString() || 0}</p>
              <p className={styles.subtext}>Total income from completed orders</p>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardHeader}>
                <h4>Registered Users</h4>
                <span className={styles.icon}>👥</span>
              </div>
              <p className={styles.value}>{stats?.totalUsers ?? 0}</p>
              <p className={styles.subtext}>Total users active in the system</p>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardHeader}>
                <h4>Verified Stores</h4>
                <span className={styles.icon}>🏪</span>
              </div>
              <p className={styles.value}>{stats?.activeStores ?? 0}</p>
              <p className={styles.subtext}>Stores approved and actively selling</p>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.cardHeader}>
                <h4>Pending Orders</h4>
                <span className={styles.icon}>🕒</span>
              </div>
              <p className={styles.value}>{stats?.pendingOrders ?? 0}</p>
              <p className={styles.subtext}>Orders awaiting confirmation</p>
            </div>
          </div>
        </div>

        {/* ===== Light Content Area ===== */}
        <div className={styles.content}>

          {/* Charts + Recent Order row */}
          <div className={styles.chartsGrid}>

            {/* Line Chart */}
            <div className={styles.chartBox}>
              <div className={styles.chartHeader}>
                <h3>📈 Sales Over Time</h3>
                <p className={styles.chartSubtitle}>
                  Monthly sales trend — Jan to {MONTHS[new Date().getMonth()]} {new Date().getFullYear()}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={stats.salesData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3e5ba9" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#3e5ba9" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf0" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#fff", borderRadius: "8px",
                      border: "1px solid #e8eaf0", fontSize: 13,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#3e5ba9"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#3e5ba9", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className={styles.chartBox}>
              <div className={styles.chartHeader}>
                <h3>🏪 Top Store Sales</h3>
                <p className={styles.chartSubtitle}>Highest performing stores this month</p>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.storeSales}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3e5ba9" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#7da4f5" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf0" />
                  <XAxis
                    dataKey="_id"
                    tickFormatter={(id) => id?.length > 10 ? id.slice(0, 10) + "…" : id}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#fff", borderRadius: "8px",
                      border: "1px solid #e8eaf0", fontSize: 13,
                    }}
                  />
                  <Bar dataKey="total" fill="url(#barGradient)" radius={[8, 8, 0, 0]} barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Order */}
            <div className={styles.recentOrdersSection}>
              <h2 className={styles.recentTitle}>Last Order Placed</h2>
              {recentOrders.length === 0 ? (
                <p className={styles.noOrders}>No orders have been placed yet.</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order._id} className={styles.orderCard}>
                    <div className={styles.orderHeader}>
                      <h3 className={styles.customerName}>
                        {order.firstName} {order.lastName}
                      </h3>
                      <span
                        className={`${styles.statusBadge} ${
                          order.paymentStatus === "completed" ? styles.completed : styles.pending
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                    <div className={styles.orderDetails}>
                      <p><strong>Email:</strong> {order.email}</p>
                      <p><strong>Amount:</strong> ${order.grandTotal?.toLocaleString()}</p>
                      <p>
                        <strong>Placed At:</strong>{" "}
                        {new Date(order.createdAt).toLocaleString("en-US", {
                          dateStyle: "medium", timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ===== Nav Cards ===== */}
          <div className={styles.grid}>
            <Link href="/admin/users">
              <div className={styles.card}>
                <span className={styles.cardIcon}>👥</span>
                <h2 className={styles.cardTitle}>Manage Users</h2>
                <p className={styles.cardText}>View and manage all user accounts.</p>
              </div>
            </Link>

            <Link href="/admin/stores">
              <div className={styles.card}>
                <span className={styles.cardIcon}>🏬</span>
                <h2 className={styles.cardTitle}>Manage Stores</h2>
                <p className={styles.cardText}>Administer and oversee all e-commerce stores.</p>
              </div>
            </Link>

            <Link href="/admin/store-requests">
              <div className={styles.card}>
                <span className={styles.cardIcon}>📦</span>
                <h2 className={styles.cardTitle}>Approve Stores</h2>
                <p className={styles.cardText}>Approve or reject stores for the platform.</p>
              </div>
            </Link>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
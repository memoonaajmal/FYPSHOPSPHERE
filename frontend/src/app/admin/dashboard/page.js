"use client";

import ProtectedRoute from "../../../../components/ProtectedRoute";
import Link from "next/link";
import styles from "../styles/AdminDashboard.module.css";
import { app } from "../../../../firebase/config";
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

  // ✅ FIXED: Properly fetch analytics after user session is restored
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.warn("⚠️ No user logged in");
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();

        const res = await fetch(`${BASE_URL}/api/admin/analytics`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }

        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("❌ Failed to load analytics:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(`.${styles.title}`, {
        y: -40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(`.${styles.card}`, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: `.${styles.grid}`,
          start: "top 85%",
        },
      });

      const cards = gsap.utils.toArray(`.${styles.card}`);
      cards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, { scale: 1.05, duration: 0.3, ease: "power2.out" });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, { scale: 1, duration: 0.3, ease: "power2.out" });
        });
      });
    }, dashboardRef);

    return () => ctx.revert();
  }, []);

  if (loading)
    return <p className={styles.loading}>Loading analytics...</p>;

  return (
    <ProtectedRoute role="admin">
      <div ref={dashboardRef} className={styles.dashboard}>
        <h1 className={styles.title}>Admin Dashboard</h1>

        {/* ✅ Summary Cards */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <h4>Total Sales</h4>
              <span className={styles.icon}>📈</span>
            </div>
            <p className={styles.value}>${stats?.totalSales?.toLocaleString() || 0}</p>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <h4>Total Users</h4>
              <span className={styles.icon}>👤</span>
            </div>
            <p className={styles.value}>{stats?.totalUsers ?? 0}</p>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <h4>Active Stores</h4>
              <span className={styles.icon}>🏬</span>
            </div>
            <p className={styles.value}>{stats?.activeStores ?? 0}</p>
          </div>

          <div className={styles.summaryCard}>
            <div className={styles.cardHeader}>
              <h4>Pending Orders</h4>
              <span className={styles.icon}>🛒</span>
            </div>
            <p className={styles.value}>{stats?.pendingOrders ?? 0}</p>
          </div>
        </div>

        {/* ✅ Charts Section */}
 <div className={styles.chartsGrid}>
  {/* 📈 Line Chart - Sales Over Time */}
  <div className={styles.chartBox}>
    <div className={styles.chartHeader}>
      <h3>📈 Sales Over Time (Last 12 Months)</h3>
      <p className={styles.chartSubtitle}>Trend of total monthly sales</p>
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={stats.salesData}>
        <defs>
          {/* Smooth gradient for the line */}
          <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--carob)" stopOpacity={0.9} />
            <stop offset="100%" stopColor="var(--carob)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
        <XAxis dataKey="month" tick={{ fill: "var(--muted)" }} />
        <YAxis tick={{ fill: "var(--muted)" }} />
        <Tooltip
          contentStyle={{
            background: "var(--glass)",
            backdropFilter: "blur(8px)",
            borderRadius: "8px",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
          labelStyle={{ color: "var(--carob)" }}
        />
        <Line
          type="monotone"
          dataKey="sales"
          stroke="url(#salesGradient)"
          strokeWidth={3}
          dot={{ r: 4, fill: "var(--carob)", strokeWidth: 2 }}
          activeDot={{ r: 6, stroke: "var(--carob)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>

  {/* 🏪 Bar Chart - Top Store Sales */}
  <div className={styles.chartBox}>
    <div className={styles.chartHeader}>
      <h3>🏪 Top Store Sales</h3>
      <p className={styles.chartSubtitle}>Highest performing stores this month</p>
    </div>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={stats.storeSales}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
        <XAxis
          dataKey="_id"
          tickFormatter={(id) =>
            id?.length > 10 ? id.slice(0, 10) + "..." : id
          }
          tick={{ fill: "var(--muted)" }}
        />
        <YAxis tick={{ fill: "var(--muted)" }} />
        <Tooltip
          contentStyle={{
            background: "var(--glass)",
            backdropFilter: "blur(8px)",
            borderRadius: "8px",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        />
        <defs>
          {/* Gradient fill for bars */}
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--matcha)" stopOpacity={0.9} />
            <stop offset="100%" stopColor="var(--matcha)" stopOpacity={0.4} />
          </linearGradient>
        </defs>
        <Bar
          dataKey="total"
          fill="url(#barGradient)"
          radius={[12, 12, 0, 0]}
          barSize={70}
        />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>


        {/* ✅ Management Links */}
        <div className={styles.grid}>
          <Link href="/admin/users">
            <div className={styles.card}>
              <div className={styles.icon}>👥</div>
              <h2 className={styles.cardTitle}>Manage Users</h2>
              <p className={styles.cardText}>View and manage all user accounts.</p>
            </div>
          </Link>

          <Link href="/admin/stores">
            <div className={styles.card}>
              <div className={styles.icon}>🏬</div>
              <h2 className={styles.cardTitle}>Manage Stores</h2>
              <p className={styles.cardText}>
                Administer and oversee all e-commerce stores.
              </p>
            </div>
          </Link>

          <Link href="/admin/store-requests">
            <div className={styles.card}>
              <div className={styles.icon}>📦</div>
              <h2 className={styles.cardTitle}>Approve Stores</h2>
              <p className={styles.cardText}>
                approve or reject stores for the platform.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}

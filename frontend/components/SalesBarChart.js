"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import styles from "./styles/SalesBarChart.module.css";

export default function SalesBarChart() {
  const [salesData, setSalesData] = useState([]);
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
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics/sales`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
        setSalesData(res.data.sales || []);
      } catch (err) {
        console.error("Error fetching sales data:", err.response?.data || err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <p className={styles.loadingText}>Loading sales data...</p>;
  if (!salesData.length)
    return <p className={styles.loadingText}>No sales data available.</p>;

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.title}>Sales Overview</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={salesData}
          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
        >
          {/* Gradient for bar fill */}
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="10%" stopColor="#3b82f6" stopOpacity={0.9} />
              <stop offset="90%" stopColor="#3b82f6" stopOpacity={0.3} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              fontSize: "13px",
            }}
          />
          <Bar
            dataKey="value"
            fill="url(#colorSales)"
            radius={[10, 10, 0, 0]}
            barSize={40}
            animationDuration={1000}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

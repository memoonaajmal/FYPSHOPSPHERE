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
  Label,
} from "recharts";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import styles from "./styles/SalesBarChart.module.css";

export default function SalesBarChart() {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false); // 👈 for smooth overlay
  const [range, setRange] = useState("weekly");

  const fetchSalesData = async (user, selectedRange) => {
    try {
      if (!loading) setIsUpdating(true); // show overlay only after first load

      const token = await user.getIdToken();
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics/sales?range=${selectedRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      // slight delay so overlay feels intentional
      setTimeout(() => {
        setSalesData(res.data.sales || []);
        setIsUpdating(false);
        setLoading(false);
      }, 400);
    } catch (err) {
      console.error("Error fetching sales data:", err.response?.data || err);
      setIsUpdating(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.error("No user logged in");
        setLoading(false);
        return;
      }
      fetchSalesData(user, range);
    });
    return () => unsubscribe();
  }, [range]);

  if (loading) return <p className={styles.loadingText}>Loading sales data...</p>;
  if (!salesData.length)
    return <p className={styles.loadingText}>No sales data available.</p>;

  const xLabel = range === "daily" ? "Hours" : "Days";

  return (
    <div className={styles.chartContainer}>
      <div className={styles.header}>
        <h3 className={styles.title}>Sales Overview</h3>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className={styles.rangeDropdown}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      <div className={styles.chartWrapper}>
        {/* Overlay spinner when switching range */}
        {isUpdating && (
          <div className={styles.overlay}>
            <div className={styles.spinner}></div>
          </div>
        )}

        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={salesData}
            margin={{ top: 10, right: 30, left: 0, bottom: 25 }}
          >
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7f9372" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#a9b99f" stopOpacity={0.9} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.4} />

            <XAxis
  dataKey="name"
  tick={{ fill: "var(--muted)", fontSize: 12 }}
  tickLine={false}
  axisLine={false}
>
  <Label
    value={xLabel}
    offset={-15}
    position="insideBottom"
    style={{
      fill: "var(--carob)",
      fontSize: 13,
      fontWeight: 600,
    }}
  />
</XAxis>

<YAxis
  tick={{ fill: "var(--muted)", fontSize: 12 }}
  tickLine={false}
  axisLine={false}
>
  <Label
    value="Sales Revenue"
    angle={-90}
    position="center"
    dx={-24} // 👈 pushes label left so it’s visible
    style={{
      fill: "var(--carob)",
      fontSize: 13,
      fontWeight: 600,
    }}
  />
</YAxis>


            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                fontSize: "13px",
                color: "#374151",
              }}
            />
            <Bar
              dataKey="value"
              fill="url(#colorSales)"
              radius={[14, 14, 0, 0]}
              barSize={40}
              animationBegin={0}
              animationDuration={1400}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

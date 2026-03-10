"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Stack,
  Pagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import styles from "../styles/AllStoresAdmin.module.css";
import { getAuth } from "firebase/auth";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 6;

  useEffect(() => {
    async function fetchStores() {
      try {
        setLoading(true);
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("User not logged in");
        const token = await currentUser.getIdToken();
        const res = await fetch(
          `${BASE_URL}/api/admin/stores?page=${currentPage}&limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) throw new Error("Unauthorized or failed request");
        const data = await res.json();
        if (data?.stores) {
          setStores(data.stores);
          setTotalPages(data.totalPages || 1);
        } else {
          setStores([]);
        }
      } catch (err) {
        console.error("Error fetching stores:", err);
        setError("Failed to load stores.");
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, [currentPage]);

  const filteredStores = useMemo(() => {
    if (!search.trim()) return stores;
    const q = search.toLowerCase();
    return stores.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.categories?.some((c) => c.toLowerCase().includes(q))
    );
  }, [stores, search]);

  return (
    <div className={styles.dashboard}>

      {/* ===== Header ===== */}
      <div className={styles.header}>
        <h1 className={styles.title}>Store Management</h1>
        <p className={styles.subtitle}>Browse and manage all registered stores</p>

        {/* Stats pill */}
        {!loading && (
          <Stack direction="row" spacing={2} mt={3} sx={{ position: "relative", zIndex: 1 }}>
            <Paper
              variant="outlined"
              sx={{
                px: 2, py: 1, borderRadius: 2,
                display: "flex", alignItems: "center", gap: 1,
                background: "rgba(255,255,255,0.07)",
                borderColor: "rgba(255,255,255,0.15)",
              }}
            >
              <StorefrontIcon fontSize="small" sx={{ color: "#7da4f5" }} />
              <Typography variant="body2" fontWeight={600} sx={{ color: "#fff", fontFamily: "inherit" }}>
                {stores.length} Stores
              </Typography>
            </Paper>
          </Stack>
        )}
      </div>

      {/* ===== Content ===== */}
      <div className={styles.content}>

        {/* Search */}
        <Box display="flex" justifyContent="center" mb={3}>
          <TextField
            size="small"
            placeholder="Search by store name or category…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              width: 380,
              "& .MuiOutlinedInput-root": {
                borderRadius: "10px",
                background: "#fff",
                fontSize: 14,
                fontFamily: "inherit",
              },
            }}
          />
        </Box>

        {/* States */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress sx={{ color: "#3e5ba9" }} />
          </Box>
        ) : error ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⚠️</div>
            <p>{error}</p>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏪</div>
            <p>No stores found.</p>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className={styles.grid}>
              {filteredStores.map((store) => (
                <Link
                  key={store._id}
                  href={`/admin/Adminstores/${store._id}`}
                  className={styles.storeCard}
                >
                  {/* Card Header */}
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
                    <Box
                      sx={{
                        width: 38, height: 38, borderRadius: "50%",
                        background: "linear-gradient(135deg, #3e5ba9, #274690)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <StorefrontIcon sx={{ color: "#fff", fontSize: 18 }} />
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: 700, fontSize: 15,
                        color: "var(--navy, #0d1320)",
                        fontFamily: "inherit",
                        lineHeight: 1.3,
                      }}
                    >
                      {store.name}
                    </Typography>
                  </Stack>

                  {/* Mini Bar Chart */}
                  <Box
                    sx={{
                      background: "#f7f8fc",
                      borderRadius: "10px",
                      p: 1,
                      mb: 1.5,
                      border: "1px solid #e8eaf0",
                    }}
                  >
                    <ResponsiveContainer width="100%" height={100}>
                      <BarChart
                        data={[{ name: "Stats", Sales: store.totalSales || 0, Orders: store.totalOrders || 0 }]}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8eaf0" />
                        <XAxis dataKey="name" hide />
                        <YAxis yAxisId="left" orientation="left" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            fontSize: 12, borderRadius: 8,
                            border: "1px solid #e8eaf0",
                            fontFamily: "inherit",
                          }}
                        />
                        <Bar yAxisId="left" dataKey="Sales" fill="#3e5ba9" barSize={32} radius={[6, 6, 0, 0]} />
                        <Bar yAxisId="right" dataKey="Orders" fill="#22c55e" barSize={32} radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>

                  {/* Stats Row */}
                  <Stack direction="row" spacing={1} mb={1.5}>
                    <Box className={styles.statPill}>
                      <span className={styles.statLabel}>Sales</span>
                      <span className={styles.statValue}>${store.totalSales || 0}</span>
                    </Box>
                    <Box className={styles.statPill}>
                      <span className={styles.statLabel}>Orders</span>
                      <span className={styles.statValue}>{store.totalOrders || 0}</span>
                    </Box>
                  </Stack>

                  {/* Category Badges */}
                  {Array.isArray(store.categories) && store.categories.length > 0 && (
                    <Stack direction="row" flexWrap="wrap" gap={0.6} mt={0.5}>
                      {store.categories.slice(0, 3).map((cat, i) => (
                        <Chip
                          key={i}
                          label={cat}
                          size="small"
                          sx={{
                            fontSize: 11, fontFamily: "inherit", fontWeight: 600,
                            background: "rgba(62,91,169,0.08)",
                            color: "#3e5ba9",
                            border: "1px solid rgba(62,91,169,0.2)",
                            height: 22,
                          }}
                        />
                      ))}
                      {store.categories.length > 3 && (
                        <Chip
                          label={`+${store.categories.length - 3}`}
                          size="small"
                          sx={{
                            fontSize: 11, fontFamily: "inherit", fontWeight: 600,
                            background: "rgba(62,91,169,0.05)",
                            color: "#6b7280",
                            border: "1px solid #e8eaf0",
                            height: 22,
                          }}
                        />
                      )}
                    </Stack>
                  )}
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, val) => setCurrentPage(val)}
                  shape="rounded"
                  sx={{
                    "& .MuiPaginationItem-root": {
                      fontFamily: "inherit",
                      fontWeight: 600,
                      color: "var(--navy, #0d1320)",
                    },
                    "& .MuiPaginationItem-root.Mui-selected": {
                      background: "#3e5ba9",
                      color: "#fff",
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </div>
    </div>
  );
}
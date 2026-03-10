"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Stack,
  Divider,
} from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SearchIcon from "@mui/icons-material/Search";
import styles from "../styles/UsersPage.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetch(`${BASE_URL}/api/admin/users`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
        else if (data?.users && Array.isArray(data.users)) setUsers(data.users);
        else setUsers([]);
      })
      .catch((err) => console.error("Error fetching users", err))
      .finally(() => setLoading(false));
  }, []);

  const normalUsers = users.filter((u) =>
    Array.isArray(u.roles) ? u.roles.includes("user") : u.roles === "user"
  );
  const storeOwners = users.filter((u) =>
    Array.isArray(u.roles) ? u.roles.includes("seller") : u.roles === "seller"
  );

  const activeData = activeTab === 0 ? normalUsers : storeOwners;

  const filteredData = useMemo(() => {
    if (!search.trim()) return activeData;
    const q = search.toLowerCase();
    return activeData.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [activeData, search]);

  if (!mounted) return null;

  if (loading)
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress />
      </Box>
    );

  return (
    <div className={styles.dashboard}>

      {/* ===== Header Banner ===== */}
      <div className={styles.header}>
        <h1 className={styles.title}>User Management</h1>
        <p className={styles.subtitle}>Manage all users and store owners</p>

        {/* Stats pills inside header */}
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
            <PeopleAltIcon fontSize="small" sx={{ color: "#7da4f5" }} />
            <Typography variant="body2" fontWeight={600} sx={{ color: "#fff", fontFamily: "inherit" }}>
              {normalUsers.length} Users
            </Typography>
          </Paper>
          <Paper
            variant="outlined"
            sx={{
              px: 2, py: 1, borderRadius: 2,
              display: "flex", alignItems: "center", gap: 1,
              background: "rgba(255,255,255,0.07)",
              borderColor: "rgba(255,255,255,0.15)",
            }}
          >
            <StorefrontIcon fontSize="small" sx={{ color: "#f5a623" }} />
            <Typography variant="body2" fontWeight={600} sx={{ color: "#fff", fontFamily: "inherit" }}>
              {storeOwners.length} Store Owners
            </Typography>
          </Paper>
        </Stack>
      </div>

      {/* ===== Content Area ===== */}
      <div className={styles.content}>

        {/* ===== Card: Tabs + Search + Table ===== */}
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>

          {/* Tabs + Search row (MUI — unchanged) */}
          <Box
            sx={{
              px: 2, pt: 1,
              display: "flex", alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap", gap: 1,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, val) => { setActiveTab(val); setSearch(""); }}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <PeopleAltIcon fontSize="small" />
                    <span>Users</span>
                    <Chip label={normalUsers.length} size="small" color="primary" />
                  </Stack>
                }
              />
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <StorefrontIcon fontSize="small" />
                    <span>Store Owners</span>
                    <Chip label={storeOwners.length} size="small" color="warning" />
                  </Stack>
                }
              />
            </Tabs>

            <TextField
              size="small"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 280 }}
            />
          </Box>

          <Divider />

          {/* ===== Native Table (replaces DataGrid) ===== */}
          {filteredData.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <p>No users match your search.</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role(s)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((u) => {
                    const roles = Array.isArray(u.roles) ? u.roles : [u.roles];
                    const isSeller = roles.includes("seller");
                    return (
                      <tr key={u._id}>
                        <td>
                          <div className={styles.nameCell}>
                            <div
                              className={`${styles.avatar} ${
                                isSeller ? styles.avatarSeller : styles.avatarUser
                              }`}
                            >
                              {u.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                            <span className={styles.userName}>{u.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.emailText}>{u.email}</span>
                        </td>
                        <td>
                          <div className={styles.rolesCell}>
                            {roles.map((role) => (
                              <span
                                key={role}
                                className={`${styles.roleBadge} ${
                                  role === "seller" ? styles.roleSeller : styles.roleUser
                                }`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <Link href={`/admin/users/${u._id}`}>
                            <button
                              className={`${styles.viewBtn} ${
                                isSeller ? styles.viewBtnSeller : ""
                              }`}
                            >
                              View Details
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Paper>
      </div>
    </div>
  );
}
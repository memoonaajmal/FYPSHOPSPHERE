"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Avatar,
  Stack,
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import StorefrontIcon from "@mui/icons-material/Storefront";
import SearchIcon from "@mui/icons-material/Search";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false); // ✅ fix hydration
  const [activeTab, setActiveTab] = useState(0);
  const [search, setSearch] = useState("");

  // ✅ ensure component only renders UI after client mount
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

  const columns = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={1.5} height="100%">
          <Avatar
            sx={{
              width: 32,
              height: 32,
              fontSize: 13,
              bgcolor: activeTab === 0 ? "primary.main" : "warning.main",
            }}
          >
            {params.value?.[0]?.toUpperCase() ?? "?"}
          </Avatar>
          <Typography variant="body2" fontWeight={500}>
            {params.value}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1.5,
      minWidth: 220,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value}
        </Typography>
      ),
    },
    {
      field: "roles",
      headerName: "Role(s)",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} alignItems="center" height="100%">
          {(Array.isArray(params.value) ? params.value : [params.value]).map(
            (role) => (
              <Chip
                key={role}
                label={role}
                size="small"
                color={role === "seller" ? "warning" : "primary"}
                variant="outlined"
                sx={{ textTransform: "capitalize" }}
              />
            )
          )}
        </Stack>
      ),
    },
    {
      field: "_id",
      headerName: "Action",
      flex: 0.8,
      minWidth: 130,
      sortable: false,
      renderCell: (params) => (
        <Stack height="100%" justifyContent="center">
          <Link href={`/admin/users/${params.value}`}>
            <Button
              variant="contained"
              size="small"
              disableElevation
              color={activeTab === 0 ? "primary" : "warning"}
              sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600 }}
            >
              View Details
            </Button>
          </Link>
        </Stack>
      ),
    },
  ];

  const rows = filteredData.map((u) => ({ ...u, id: u._id }));

  // ✅ don't render anything until client is mounted — prevents hydration mismatch
  if (!mounted) return null;

  if (loading)
    return (
      <Box display="flex" justifyContent="center" py={10}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ py: 4, px: 3 }}>
      {/* Header */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={4}
        flexWrap="wrap"
        gap={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage all users and store owners
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Paper
            variant="outlined"
            sx={{
              px: 2,
              py: 1,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <PeopleAltIcon fontSize="small" color="primary" />
            <Typography variant="body2" fontWeight={600}>
              {normalUsers.length} Users
            </Typography>
          </Paper>
          <Paper
            variant="outlined"
            sx={{
              px: 2,
              py: 1,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <StorefrontIcon fontSize="small" color="warning" />
            <Typography variant="body2" fontWeight={600}>
              {storeOwners.length} Store Owners
            </Typography>
          </Paper>
        </Stack>
      </Stack>

      {/* Main Card */}
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        {/* Tabs + Search */}
        <Box
          sx={{
            px: 2,
            pt: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, val) => {
              setActiveTab(val);
              setSearch("");
            }}
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
                  <Chip
                    label={storeOwners.length}
                    size="small"
                    color="warning"
                  />
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

        {/* DataGrid */}
        <Box sx={{ height: 520 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            disableColumnMenu
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "grey.50",
                fontWeight: 700,
                fontSize: 13,
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "grey.50",
              },
              "& .MuiDataGrid-cell": {
                borderBottom: "1px solid",
                borderColor: "grey.100",
              },
              "& .MuiDataGrid-footerContainer": {
                borderTop: "1px solid",
                borderColor: "grey.200",
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}
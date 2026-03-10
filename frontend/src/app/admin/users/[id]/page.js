"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Paper,
  Divider,
  Chip,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import UserDetails from "../../../../../components/UserDetails";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function UserDetailsPage() {
  const { id: userId } = useParams();
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setFirebaseUser(u));
    return () => unsubscribe();
  }, []);

  const fetchWithAuth = async (url, options = {}) => {
    if (!firebaseUser) throw new Error("User not logged in");
    const token = await firebaseUser.getIdToken();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  };

  useEffect(() => {
    if (!userId || !firebaseUser) return;
    const fetchUser = async () => {
      try {
        const res = await fetchWithAuth(`${BASE_URL}/api/admin/users/${userId}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };
    fetchUser();
  }, [userId, firebaseUser]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetchWithAuth(`${BASE_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Failed to delete user: ${res.status}`);
      alert("✅ User deleted successfully!");
      router.push("/admin/users");
    } catch (err) {
      console.error("❌ Error deleting user:", err);
      alert("Failed to delete user.");
    }
  };

  const handleViewOrders = () => {
    const isSeller = Array.isArray(user.roles) && user.roles.includes("seller");
    router.push(
      isSeller
        ? `/admin/users/${user._id}/adminOrderDetail`
        : `/admin/users/${user._id}/userOrderDetail`
    );
  };

  if (!mounted) return null;

  // ── Loading / auth states ──
  if (!firebaseUser)
    return (
      <Box
        display="flex" justifyContent="center" alignItems="center"
        minHeight="100vh" sx={{ bgcolor: "#0d1320" }}
      >
        <Typography sx={{ color: "rgba(255,255,255,0.5)" }}>
          🔑 Waiting for login...
        </Typography>
      </Box>
    );

  if (!user)
    return (
      <Box
        display="flex" justifyContent="center" alignItems="center"
        minHeight="100vh" sx={{ bgcolor: "#0d1320" }}
      >
        <CircularProgress sx={{ color: "#7da4f5" }} />
      </Box>
    );

  const roles = Array.isArray(user.roles) ? user.roles : [user.roles];
  const isSeller = roles.includes("seller");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0d1320",
        fontFamily: '"DM Sans", "Segoe UI", sans-serif',
        position: "relative",
        overflow: "hidden",
        // Glow blobs
        "&::before": {
          content: '""',
          position: "fixed",
          top: "-200px", left: "-100px",
          width: "600px", height: "600px",
          background: "radial-gradient(circle at center, rgba(39,70,144,0.35) 0%, transparent 65%)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 0,
          filter: "blur(40px)",
        },
        "&::after": {
          content: '""',
          position: "fixed",
          bottom: "-150px", right: "-100px",
          width: "500px", height: "500px",
          background: "radial-gradient(circle at center, rgba(62,91,169,0.28) 0%, transparent 65%)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 0,
          filter: "blur(50px)",
        },
      }}
    >
      {/* ===== Dark Header ===== */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          px: { xs: 3, md: 7.5 },
          pt: { xs: 6, md: 12 },
          pb: { xs: 4, md: 6 },
        }}
      >
        {/* Back button */}
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/admin/users")}
          sx={{
            color: "rgba(255,255,255,0.55)",
            mb: 3,
            textTransform: "none",
            fontFamily: "inherit",
            fontSize: 13,
            px: 0,
            "&:hover": { color: "#fff", background: "transparent" },
          }}
        >
          Back to Users
        </Button>

        <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" gap={1}>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "#fff", fontFamily: "inherit", mb: 0.5 }}
            >
              {user.name}
            </Typography>
            <Typography sx={{ fontSize: 14, color: "rgba(255,255,255,0.5)", fontFamily: "inherit" }}>
              {user.email}
            </Typography>
          </Box>

          {/* Role badges */}
          <Stack direction="row" spacing={1} ml={{ xs: 0, sm: "auto" }}>
            {roles.map((role) => (
              <Chip
                key={role}
                label={role}
                size="small"
                sx={{
                  fontFamily: "inherit",
                  fontWeight: 600,
                  textTransform: "capitalize",
                  background: role === "seller"
                    ? "rgba(245,166,35,0.15)"
                    : "rgba(125,164,245,0.15)",
                  color: role === "seller" ? "#f5a623" : "#7da4f5",
                  border: "1px solid",
                  borderColor: role === "seller"
                    ? "rgba(245,166,35,0.3)"
                    : "rgba(125,164,245,0.3)",
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Box>

      {/* ===== Light Content Card ===== */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          px: { xs: 2, md: 7.5 },
          pb: 8,
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            maxWidth: 680,
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "grey.200",
            boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
          }}
        >
          {/* Card Header */}
          <Box sx={{ px: 3, py: 2.5, bgcolor: "#f7f8fc" }}>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ fontFamily: "inherit", color: "#0d1320" }}
            >
              User Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "inherit" }}>
              Full profile and account details
            </Typography>
          </Box>

          <Divider />

          {/* User Details Content */}
          <Box sx={{ px: 3, py: 3 }}>
            <UserDetails user={user} />
          </Box>

          <Divider />

          {/* Action Buttons */}
          <Box sx={{ px: 3, py: 2.5, bgcolor: "#f7f8fc" }}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDelete}
                disableElevation
                sx={{
                  textTransform: "none",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                Delete User
              </Button>
              <Button
                variant="contained"
                startIcon={<ReceiptLongIcon />}
                onClick={handleViewOrders}
                disableElevation
                sx={{
                  textTransform: "none",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  borderRadius: 2,
                  bgcolor: isSeller ? "#f5a623" : "#3e5ba9",
                  "&:hover": {
                    bgcolor: isSeller ? "#d9911a" : "#2f4a8f",
                  },
                }}
              >
                View Orders
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
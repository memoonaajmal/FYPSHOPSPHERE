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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
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

  if (!firebaseUser)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="text.secondary">🔑 Waiting for login...</Typography>
      </Box>
    );

  if (!user)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );

  return (
    // ✅ full page centering
    <Box
      display="flex"
      justifyContent="center"
      alignItems="flex-start"
      minHeight="100vh"
      sx={{ py: 6, px: 2, bgcolor: "grey.50" }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 600,       // ✅ card max width
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {/* Card Header */}
        <Box sx={{ px: 3, py: 2.5, bgcolor: "grey.50" }}>
          <Typography variant="h6" fontWeight={700}>
            User Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage user information
          </Typography>
        </Box>

        <Divider />

        {/* User Details Content */}
        <Box sx={{ px: 3, py: 3 }}>
          <UserDetails user={user} />
        </Box>

        <Divider />

        {/* Action Buttons — bottom of card */}
        <Box sx={{ px: 3, py: 2.5 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              disableElevation
            >
              Delete User
            </Button>
            <Button
              variant="contained"
              startIcon={<ReceiptLongIcon />}
              onClick={handleViewOrders}
              disableElevation
            >
              View Orders
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
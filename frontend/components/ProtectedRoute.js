"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../src/context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Not logged in → go home
    if (!user) {
      router.replace("/");
      return;
    }

    const isAdmin = user.roles?.includes("admin");
    const isSeller = user.roles?.includes("seller");

    // A specific role is required for this page
    if (role) {
      if (!user.roles?.includes(role)) {
        // Wrong role — redirect silently to their own dashboard, no alert
        if (isAdmin) router.replace("/admin/dashboard");
        else if (isSeller) router.replace("/seller/dashboard");
        else router.replace("/");
      }
      // Correct role — let them through (do nothing)
      return;
    }

    // No role required (public/user page) — redirect admin/seller to their dashboard
    if (isAdmin) {
      router.replace("/admin/dashboard");
    } else if (isSeller) {
      router.replace("/seller/dashboard");
    }
  }, [user, loading, role, router]);

  if (loading) return <p>Loading...</p>;

  // While redirecting, render nothing to avoid flash
  if (!loading && user) {
    const isAdmin = user.roles?.includes("admin");
    const isSeller = user.roles?.includes("seller");

    if (role && !user.roles?.includes(role)) return null;
    if (!role && (isAdmin || isSeller)) return null;
  }

  return <>{children}</>;
}
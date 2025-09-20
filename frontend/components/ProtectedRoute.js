"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../src/context/AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else {
        // ❌ User tries to access a page not allowed for their role
        if (role && !user.roles?.includes(role)) {
          alert(`You cannot access this page as your role is "${user.roles.join(", ")}"`);
          // Redirect to proper dashboard
          if (user.roles.includes("admin")) router.replace("/admin/dashboard");
          else if (user.roles.includes("seller")) router.replace("/seller/dashboard");
          else router.replace("/"); // fallback for normal user
        } 
        // ✅ No role required (public user page) → redirect admin/seller to dashboard
        else if (!role) {
          if (user.roles.includes("admin")) router.replace("/admin/dashboard");
          else if (user.roles.includes("seller")) router.replace("/seller/dashboard");
        }
      }
    }
  }, [user, loading, role, router]);

  if (loading) return <p>Loading...</p>;
  return <>{children}</>;
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import UserDetails from "../../../../../components/UserDetails";

export default function UserDetailsPage() {
  const { id: userId } = useParams(); // cleaner destructuring
  const router = useRouter();
  const [user, setUser] = useState(null);

  // ✅ Fetch single user
  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users/${userId}`,
          { credentials: "include" }
        );

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error("Error fetching user details:", err);
      }
    };

    fetchUser();
  }, [userId]);

  // ✅ Delete user
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users/${userId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to delete user: ${res.status} - ${errorText}`);
      }

      alert("✅ User deleted successfully!");
      router.push("/admin/users"); // Redirect to users list
    } catch (err) {
      console.error("❌ Error deleting user:", err);
      alert("Failed to delete user. Check console for details.");
    }
  };

  if (!user) return <p style={{ padding: "24px" }}>Loading user details...</p>;

  return (
    <div style={{ padding: "24px" }}>
      <UserDetails user={user} />

      <button
        onClick={handleDelete}
        style={{
          marginTop: "20px",
          padding: "10px 16px",
          border: "none",
          borderRadius: "6px",
          background: "#dc2626",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Delete User
      </button>
    </div>
  );
}

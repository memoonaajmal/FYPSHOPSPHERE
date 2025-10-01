"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import UserDetails from "../../../../../components/UserDetails";
import styles from "../../styles/UserDetails.module.css";

export default function UserDetailsPage() {
  const { id: userId } = useParams();
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);

  // ✅ Watch Firebase Auth state
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
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

  // ✅ Fetch single user
  useEffect(() => {
    if (!userId || !firebaseUser) return;

    const fetchUser = async () => {
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users/${userId}`
        );
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
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/users/${userId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`Failed to delete user: ${res.status}`);
      alert("✅ User deleted successfully!");
      router.push("/admin/users");
    } catch (err) {
      console.error("❌ Error deleting user:", err);
      alert("Failed to delete user.");
    }
  };

  if (!firebaseUser) {
    return <p style={{ padding: "24px" }}>🔑 Waiting for login...</p>;
  }
  if (!user) return <p style={{ padding: "24px" }}>Loading user details...</p>;

  return (
    <div className={styles.container}>
      <UserDetails user={user} />

      <button
        onClick={handleDelete}
        className={`${styles.button} ${styles.btnDanger}`}
      >
        Delete User
      </button>

      <div style={{ marginTop: "30px" }}>
        <button
          onClick={() =>
            router.push(
              Array.isArray(user.roles) && user.roles.includes("seller")
                ? `/admin/users/${user._id}/adminOrderDetail`
                : `/admin/users/${user._id}/userOrderDetail`
            )
          }
          className={`${styles.button} ${styles.btnPrimary}`}
        >
          View Orders
        </button>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { auth } from "../../../firebase/config";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import styles from "../../styles/Profile.module.css";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!auth.currentUser) {
      // redirect to login if not logged in
      router.push("/login");
    } else {
      setUser(auth.currentUser);
    }
  }, [router]);

  if (!user) return null; // or a loader

  return (
    <div className={styles.profileContainer}>
      <h1>Profile</h1>

      <div className={styles.profileCard}>
        <p>
          <strong>Name:</strong> {user.displayName || "N/A"}
        </p>
        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <div className={styles.buttonGroup}>
          <button onClick={() => router.push("/orders")}>My Orders</button>
          <button onClick={() => signOut(auth).then(() => router.push("/"))}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

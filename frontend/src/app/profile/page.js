"use client";
import { useEffect, useState } from "react";
import { auth } from "../../../firebase/config";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import styles from "../../styles/Profile.module.css";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push("/login");
      }
      setAuthChecked(true); // auth state is now known
    });

    return () => unsubscribe();
  }, [router]);

  if (!authChecked) return null; // or a loader while checking auth
  if (!user) return null; // in case redirect happened

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

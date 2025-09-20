"use client";
import styles from "../../styles/login.module.css";
import { useState } from "react";
import { auth } from "../../../firebase/config";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // frontend dropdown
  const [error, setError] = useState("");
  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  const { setUser } = useAuth();

 const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  try {
    // 1️⃣ Firebase login
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCred.user;
    const token = await firebaseUser.getIdToken(true);

    // 2️⃣ Sync with backend
    const response = await fetch(`${BASE_URL}/api/auth/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });

    const data = await response.json(); // ✅ parse once

    if (!response.ok) {
      await signOut(auth);
      setUser(null);
      throw new Error(data.error || "Role not allowed");
    }

    // 3️⃣ Check role
    if (!data.user.roles.includes(role)) {
      await signOut(auth);
      setUser(null);
      throw new Error(
        `You cannot log in as "${role}". Allowed roles: ${data.user.roles.join(", ")}`
      );
    }

    // 4️⃣ Set user & redirect
    setUser(data.user);
    if (role === "admin") router.push("/admin/dashboard");
    else if (role === "seller") router.push("/seller/dashboard");
    else router.push("/");

  } catch (err) {
    console.error(err);
    setError(err.message);
  }
};


  return (
    <div className={styles.container}>
      <form onSubmit={handleLogin} className={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">Login as User</option>
          <option value="seller">Login as Seller</option>
          <option value="admin">Login as Admin</option>
        </select>

        <button type="submit">Login</button>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      {/* Signup link */}
      <p className={styles.signupText}>
        Don&apos;t have an account?{" "}
        <span
          className={styles.signupLink}
          onClick={() => router.push("/signup")}
        >
          Sign up
        </span>
        .
      </p>
    </div>
  );
}

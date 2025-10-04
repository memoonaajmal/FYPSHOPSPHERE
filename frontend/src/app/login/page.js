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
  const [role, setRole] = useState("user"); // default login type
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

      const data = await response.json();

      if (!response.ok) {
        await signOut(auth);
        setUser(null);
        throw new Error(data.error || "Role not allowed");
      }

      // 3️⃣ Verify role
      if (!data.user.roles.includes(role)) {
        await signOut(auth);
        setUser(null);
        throw new Error(
          `You cannot log in as "${role}". Allowed roles: ${data.user.roles.join(
            ", "
          )}`
        );
      }

      // 4️⃣ Set user & redirect based on role
      setUser(data.user);

      if (role === "admin") {
        router.push("/admin/dashboard");
      } else if (role === "seller") {
        const checkRes = await fetch(`${BASE_URL}/api/stores/check/exists`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const checkData = await checkRes.json();

        if (checkData.hasStore) {
          router.push("/seller/dashboard");
        } else {
          router.push("/seller/create-store-request");
        }
      } else if (role === "user") {
        router.push("/"); // ✅ only users go to dashboard
      } else {
        router.push("/"); // fallback (safe redirect)
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleLogin} className={styles.form}>
        <h2 className={styles.title}>Login</h2>

        <input
          type="email"
          placeholder="Enter your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.input}
        />

        <input
          type="password"
          placeholder="Enter your Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.input}
        />

        <p
          className={styles.forgotPasswordLink}
          onClick={() => router.push("/forgot-password")}
        >
          Forgot Password?
        </p>

        <label className={styles.label}>Select Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={styles.select}
        >
          <option value="user">Login as User</option>
          <option value="seller">Login as Seller</option>
          <option value="admin">Login as Admin</option>
        </select>

        <button type="submit" className={styles.button}>
          Login
        </button>

        {error && <p className={styles.error}>{error}</p>}
      </form>

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

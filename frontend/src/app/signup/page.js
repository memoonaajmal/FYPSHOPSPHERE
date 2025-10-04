"use client";
import styles from "../../styles/signup.module.css";
import { useState } from "react";
import Link from "next/link";
import { auth } from "../../../firebase/config";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const router = useRouter();
  const { setUser } = useAuth();
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Firebase signup
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });

      // Get token
      const user = auth.currentUser;
      if (!user) throw new Error("User not available after signup");
      const idToken = await user.getIdToken(true);

      // Sync with backend
      const response = await fetch(`${BASE_URL}/api/auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ role: role.toLowerCase().trim() }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Failed to sync user with backend");
      }

      const data = await response.json();
      setUser(data.user);

      // Force logout after signup
      await signOut(auth);

      router.push("/login");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      {/* ✅ Left side image */}
      <div className={styles.imageWrapper}>
        <img
          src="https://i.pinimg.com/1200x/0c/9b/89/0c9b89b62ba04b4b4740f4ce2da28b54.jpg"
          alt="Signup Illustration"
        />
      </div>

      {/* ✅ Right side form */}
      <div className={styles.formWrapper}>
        <form onSubmit={handleSignup} className={styles.form}>
          <h2 className={styles.title}>Create Account</h2>

          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">Signup as User</option>
            <option value="seller">Signup as Seller</option>
          </select>

          <button type="submit">Sign Up</button>

          {error && <p className={styles.error}>{error}</p>}

          <p className={styles.loginText}>
            Already have an account?{" "}
            <Link href="/login" className={styles.loginLink}>
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

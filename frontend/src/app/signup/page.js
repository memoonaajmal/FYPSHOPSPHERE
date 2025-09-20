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
  const [role, setRole] = useState("user"); // default role
  const [error, setError] = useState("");
  const router = useRouter();
  const { setUser } = useAuth();
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // Firebase signup
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update displayName
      await updateProfile(userCred.user, { displayName: name });

      // Get token
      const user = auth.currentUser;
      if (!user) throw new Error("User not available after signup");
      const idToken = await user.getIdToken(true);


 // Sync with backend, include chosen role
const response = await fetch(`${BASE_URL}/api/auth/sync`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  },
  body: JSON.stringify({ role: role.toLowerCase().trim() }), // normalize here
});


      if (!response.ok) {
        const errData = await response.json();
        throw new Error(
          errData.error?.message || "Failed to sync user with backend"
        );
      }

      const data = await response.json();
      console.log("Backend user data:", data.user);

      setUser(data.user);

      // 🚀 Force logout right after signup
      await signOut(auth);

      // Redirect to login (always after signup)
      router.push("/login");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSignup} className={styles.form}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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

        {/* Role Selection */}
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="user">Signup as User</option>
          <option value="seller">Signup as Seller</option>
        </select>

        <button type="submit">Sign Up</button>
        {error && <p className={styles.error}>{error}</p>}
      </form>

      <p className={styles.loginText}>
        Already have an account?{" "}
        <Link href="/login" className={styles.loginLink}>
          Login
        </Link>
      </p>
    </div>
  );
}

"use client";
import { useState } from "react";
import { auth } from "../../../firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import styles from "../../styles/login.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // reset error
    try {
      // 1️⃣ Sign in with Firebase
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // 2️⃣ Get Firebase ID token
      const token = await user.getIdToken(true); // force refresh token

      // 3️⃣ Call backend to sync with MongoDB
      const response = await fetch("http://localhost:4000/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}), // backend middleware populates req.user
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Failed to sync user with backend");
      }

      const data = await response.json();
      console.log("Backend user data:", data.user);

      alert("Login successful! User synced with MongoDB.");
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  return (
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
      <button type="submit">Login</button>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}

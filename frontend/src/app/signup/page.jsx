"use client";
import { useState } from "react";
import Link from "next/link";
import { auth } from "../../../firebase/config";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import styles from "../../styles/signup.module.css";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(""); // reset error
    try {
      // 1️⃣ Sign up in Firebase
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // 2️⃣ Update profile with name
      await updateProfile(userCred.user, { displayName: name });

      // 3️⃣ Get Firebase ID token
      const user = auth.currentUser;
      if (!user) throw new Error("User not available after signup");
      const idToken = await user.getIdToken(true); // force refresh token

      // 4️⃣ Call backend to sync with MongoDB
      const response = await fetch("http://localhost:4000/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({}), // backend middleware populates req.user
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Failed to sync user with backend");
      }

      const data = await response.json();
      console.log("Backend user data:", data.user);

      alert("Signup successful! User saved in Firebase and MongoDB.");
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

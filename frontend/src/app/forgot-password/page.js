"use client";
import styles from "../../styles/login.module.css";
import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../../firebase/config";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("✅ Password reset email sent! Check your inbox.");
    } catch (err) {
      setError("❌ " + err.message);
    }
  };

  return (
    <div className={styles.container}>
      {/* LEFT — Form (same position as login) */}
      <div className={styles.formWrapper}>
        <form onSubmit={handleReset} className={styles.form}>
          <h2 className={styles.title}>Reset Your Password 🔒</h2>

          <input
            type="email"
            placeholder="Enter your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />

          <button type="submit" className={styles.button}>
            Send Reset Link
          </button>

          {message && <p className={styles.success}>{message}</p>}
          {error && <p className={styles.error}>{error}</p>}

          <p className={styles.signupText}>
            Remember your password?{" "}
            <span
              className={styles.signupLink}
              onClick={() => router.push("/login")}
            >
              Back to Login
            </span>
          </p>
        </form>
      </div>

      {/* RIGHT — Image (same style as login) */}
      <div className={styles.imageWrapper}>
        <img
          src="https://i.pinimg.com/1200x/12/42/02/12420249b6831eea714bad15a40a5425.jpg"
          alt="Forgot Password Illustration"
        />
      </div>
    </div>
  );
}

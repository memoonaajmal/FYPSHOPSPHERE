"use client";
import styles from "../../styles/forgot-password.module.css";
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
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formBox}>
        <div className={styles.decorativeShape}></div>
        <div className={styles.decorativeShape2}></div>

        <h2 className={styles.title}>Reset Password</h2>
        <p className={styles.subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleReset} className={styles.form}>
          <div className={styles.inputBox}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label>Email Address</label>
          </div>

          {message && (
            <div className={`${styles.message} ${styles.success}`}>
              ✓ {message}
            </div>
          )}

          {error && (
            <div className={`${styles.message} ${styles.error}`}>
              ✕ {error}
            </div>
          )}

          <button type="submit" className={styles.btn}>
            Send Reset Link
          </button>

          <div className={styles.backLink}>
            <p>
              Remember your password?{" "}
              <span
                onClick={() => router.push("/auth")}
                className={styles.link}
              >
                Back to Login
              </span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
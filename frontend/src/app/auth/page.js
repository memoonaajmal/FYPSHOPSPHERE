"use client";
import { useState } from "react";
import styles from "../../styles/auth.module.css";
import { useRouter, useSearchParams } from "next/navigation"; // ✅ added useSearchParams
import { auth } from "../../../firebase/config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { useAuth } from "../../context/AuthContext";

export default function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ added
  const redirect = searchParams.get("redirect"); // ✅ read redirect param
  const { setUser } = useAuth();
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  // Toggle animation
  const toggleForm = () => {
    setIsSignup((prev) => !prev);
    setError(""); // Clear error when toggling
    // Reset form fields when toggling
    setEmail("");
    setPassword("");
    setName("");
    setRole("user");
  };

  // Handle Signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });
      const idToken = await userCred.user.getIdToken(true);
      const response = await fetch(`${BASE_URL}/api/auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error("Failed to sync user with backend");
      const data = await response.json();
      setUser(data.user);
      await signOut(auth);
      
      // Switch to login form after successful signup
      setIsSignup(false);
      setError("");
      alert("Signup successful! Please login to continue.");
    } catch (err) {
      setError(err.message);
    }
  };

  // ✅ Handle Login (fixed redirect)
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCred.user.getIdToken(true);
      
      // Fetch user data from backend to get their roles
      const response = await fetch(`${BASE_URL}/api/auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}), // Let backend return roles
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");
      
      setUser(data.user);
      
      // Route based on user's primary role
      const userRoles = data.user.roles || [];

      if (userRoles.includes("admin")) {
        router.push("/admin/dashboard");
      } else if (userRoles.includes("seller")) {
        // Check if seller has a store
        const checkRes = await fetch(`${BASE_URL}/api/stores/check/exists`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const checkData = await checkRes.json();
        router.push(
          checkData.hasStore
            ? "/seller/dashboard"
            : "/seller/create-store-request"
        );
      } else {
        // ✅ For normal user — check redirect param
        if (redirect) {
          router.push(redirect); // Go back to intended page (e.g., /checkout)
        } else {
          router.push("/"); // Default to home
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "#25252b",
        padding: "20px",
      }}
    >
      <div className={`${styles.container} ${isSignup ? styles.active : ""}`}>
        <div className={styles.curvedShape}></div>
        <div className={styles.curvedShape2}></div>

        {/* LOGIN FORM */}
        <div className={`${styles["form-box"]} ${styles.Login}`}>
          <h2 className={styles.animation} style={{ '--D': 0, '--S': 20 }}>
            Login
          </h2>
          <form onSubmit={handleLogin}>
            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--D': 0, '--S': 20 }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Email</label>
            </div>

            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--D': 0, '--S': 20 }}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label>Password</label>
            </div>

            {error && !isSignup && (
              <div className={styles.error}>{error}</div>
            )}

            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--D': 0, '--S': 20 }}>
              <button type="submit" className={styles.btn}>
                Login
              </button>
            </div>

            <div className={`${styles.regiLink} ${styles.animation}`} style={{ '--D': 0, '--S': 20 }}>
              <p>
                Don't have an account?{" "}
                <a onClick={toggleForm} className={styles.link}>
                  Sign Up
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* LOGIN INFO */}
        <div className={`${styles["info-content"]} ${styles.Login}`}>
          <h2 className={styles.animation} style={{ '--D': 0, '--S': 20 }}>
            WELCOME BACK!
          </h2>
          <p className={styles.animation} style={{ '--D': 1, '--S': 21 }}>
            We are happy to have you with us again. If you need anything, we are here to help.
          </p>
        </div>

        {/* SIGNUP FORM */}
        <div className={`${styles["form-box"]} ${styles.Register}`}>
          <h2 className={styles.animation} style={{ '--li': 17, '--S': 0 }}>
            Register
          </h2>
          <form onSubmit={handleSignup}>
            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--li': 17, '--S': 0 }}>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <label>Full Name</label>
            </div>

            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--li': 17, '--S': 0 }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label>Email</label>
            </div>

            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--li': 17, '--S': 0 }}>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label>Password</label>
            </div>

            {/* Role Selection Dropdown for Signup */}
            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--li': 17, '--S': 0 }}>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className={styles.selectBox}
              >
                <option value="user">Sign up as User</option>
                <option value="seller">Sign up as Seller</option>
              </select>
            </div>

            {error && isSignup && (
              <div className={styles.error}>{error}</div>
            )}

            <div className={`${styles.inputBox} ${styles.animation}`} style={{ '--li': 17, '--S': 0 }}>
              <button type="submit" className={styles.btn}>
                Register
              </button>
            </div>

            <div className={`${styles.regiLink} ${styles.animation}`} style={{ '--li': 17, '--S': 0 }}>
              <p>
                Already have an account?{" "}
                <a onClick={toggleForm} className={styles.link}>
                  Login
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* SIGNUP INFO */}
        <div className={`${styles["info-content"]} ${styles.Register}`}>
          <h2 className={styles.animation} style={{ '--li': 17, '--S': 0 }}>
            WELCOME!
          </h2>
          <p className={styles.animation} style={{ '--li': 18, '--S': 1 }}>
            We're delighted to have you here. If you need any assistance, feel free to reach out.
          </p>
        </div>
      </div>
    </div>
  );
}

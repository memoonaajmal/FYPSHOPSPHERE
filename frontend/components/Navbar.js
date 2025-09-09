"use client";
import Link from "next/link";
import { UserPlus, LogIn } from "lucide-react";
import styles from "./styles/Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      {/* Left: Logo */}
      <h1 className={styles.logo}>
        <Link href="/">ShopSphere</Link>
      </h1>

      {/* Center: Navigation */}
      <div className={styles.navLinks}>
        <Link href="/products">Products</Link>
      </div>

      {/* Right: Auth Icons */}
      <div className={styles.authLinks}>
        <Link href="/signup">
          <UserPlus size={20} />
          <span> Sign Up</span>
        </Link>
        <Link href="/login">
          <LogIn size={20} />
          <span> Login</span>
        </Link>
      </div>
    </nav>
  );
}

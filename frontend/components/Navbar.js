"use client";
import Link from "next/link";
import { UserPlus, LogIn, ShoppingCart } from "lucide-react"; // added ShoppingCart icon
import styles from "./styles/Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      {/* Left: Logo */}
      <h1 className={styles.logo}>
        <Link href="/">ShopSphere</Link>
      </h1>

      {/* Right: Auth & Cart Icons */}
      <div className={styles.authLinks}>
        <Link href="/signup">
          <UserPlus size={20} />
          <span> Sign Up</span>
        </Link>
        <Link href="/login">
          <LogIn size={20} />
          <span> Login</span>
        </Link>

        {/* Cart Icon */}
        <Link href="/cart" className={styles.cartLink}>
          <ShoppingCart size={20} />
          <span> Cart</span>
        </Link>
      </div>
    </nav>
  );
}

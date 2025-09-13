"use client";
import Link from "next/link";
import { UserPlus, LogIn, ShoppingCart, Heart } from "lucide-react"; // ✅ added Heart
import styles from "./styles/Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      {/* Left: Logo */}
      <h1 className={styles.logo}>
        <Link href="/">ShopSphere</Link>
      </h1>

      {/* Right: Auth, Wishlist & Cart Icons */}
      <div className={styles.authLinks}>
        <Link href="/signup">
          <UserPlus size={20} />
          <span> Sign Up</span>
        </Link>
        <Link href="/login">
          <LogIn size={20} />
          <span> Login</span>
        </Link>

        {/* ✅ Wishlist */}
        <Link href="/wishlist" className={styles.wishlistLink}>
          <Heart size={20} />
          <span> Wishlist</span>
        </Link>

        {/* ✅ Cart */}
        <Link href="/cart" className={styles.cartLink}>
          <ShoppingCart size={20} />
          <span> Cart</span>
        </Link>
      </div>
    </nav>
  );
}

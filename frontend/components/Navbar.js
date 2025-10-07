"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LogIn, ShoppingCart, Heart } from "lucide-react";
import { auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import styles from "./styles/Navbar.module.css";

export default function Navbar() {
const [user, setUser] = useState(null);

useEffect(() => {
const unsubscribe = onAuthStateChanged(auth, setUser);
return () => unsubscribe();
}, []);

return ( <nav className={styles.navbar}>
{/* Left: Logo */} <h1 className={styles.logo}> <Link href="/">ShopSphere</Link> </h1>

```
  {/* Center: Hello, username */}
  {user && (
    <Link href="/profile" className={styles.userGreeting}>
      Hello, {user.displayName || user.name}
    </Link>
  )}

  {/* Right: Auth / Wishlist / Cart */}
  <div className={styles.icons}>
    {!user && (
      <Link href="/auth">
        <LogIn size={20} />
        <span> Login / Sign Up</span>
      </Link>
    )}

    <Link href="/wishlist">
      <Heart size={20} />
      <span> Wishlist</span>
    </Link>

    <Link href="/cart">
      <ShoppingCart size={20} />
      <span> Cart</span>
    </Link>
  </div>
</nav>


);
}

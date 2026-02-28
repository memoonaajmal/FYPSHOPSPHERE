"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart, Heart, User, Menu, X } from "lucide-react";
import { useAuth } from "../src/context/AuthContext";
import { getAuth } from "firebase/auth";
import styles from "./styles/Navbar.module.css";

export default function Navbar() {
  const { user } = useAuth();
  const [role, setRole] = useState(null);
  const [isRoleLoaded, setIsRoleLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // SCROLL LISTENER
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // CHECK ROLE AND STORE
  useEffect(() => {
    setIsRoleLoaded(false);
    const auth = getAuth();

    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!user || !currentUser) {
        setRole(null);
        setIsRoleLoaded(true);
        return;
      }

      const userRoles = user.roles || [];

      if (userRoles.includes("admin")) {
        setRole("admin");
        setIsRoleLoaded(true);
      } else if (userRoles.includes("seller")) {
        try {
          const token = await currentUser.getIdToken();
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/stores/check/exists`,
            {
              headers: { Authorization: `Bearer ${token}` },
              credentials: "include",
            }
          );

          if (!res.ok) throw new Error("Unauthorized");

          const data = await res.json();
          setRole(data.hasStore ? "seller" : "new-seller");
        } catch (error) {
          console.error("Failed to fetch seller store:", error);
          setRole("new-seller");
        } finally {
          setIsRoleLoaded(true);
        }
      } else {
        setRole("user");
        setIsRoleLoaded(true);
      }
    });

    return () => unsubscribe();
  }, [user]);

  // SCROLL FUNCTIONS
  const scrollToElementWithOffset = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return false;
    const nav = document.getElementById("main-navbar");
    const navHeight = nav ? nav.getBoundingClientRect().height : 0;
    const rectTop = el.getBoundingClientRect().top + window.scrollY;
    const targetY = Math.max(0, rectTop - navHeight - 12);
    window.scrollTo({ top: targetY, behavior: "smooth" });
    return true;
  };

  const waitForAndScroll = (selector) => {
    let tries = 0;
    const maxTries = 80;
    const interval = 100;
    const id = setInterval(() => {
      tries += 1;
      const el = document.querySelector(selector);
      if (el) {
        clearInterval(id);
        setTimeout(() => scrollToElementWithOffset(selector), 50);
      } else if (tries >= maxTries) {
        clearInterval(id);
      }
    }, interval);
  };

  const handleScrollToSection = (id) => {
    if (pathname === "/seller/dashboard") {
      waitForAndScroll(id);
    } else {
      sessionStorage.setItem("scrollTarget", id);
      router.push("/seller/dashboard");
    }
  };

  useEffect(() => {
    const target = sessionStorage.getItem("scrollTarget");
    if (pathname === "/seller/dashboard" && target) {
      const timeout = setTimeout(() => {
        waitForAndScroll(target);
        sessionStorage.removeItem("scrollTarget");
      }, 800);
      return () => clearTimeout(timeout);
    } else if (pathname !== "/seller/dashboard") {
      sessionStorage.removeItem("scrollTarget");
    }
  }, [pathname]);

  // Helper: is this link active?
  const isActive = (href) =>
    pathname === href || pathname.startsWith(href + "/");

  // CENTER LINKS
  const renderCenterLinks = () => {
    if (!isRoleLoaded) return null;

    if (role === "seller") {
      return (
        <>
          <button
            className={styles.navBtn}
            onClick={() => handleScrollToSection("#business-overview")}
          >
            Business Overview
          </button>
          <button
            className={styles.navBtn}
            onClick={() => handleScrollToSection("#customer-analytics")}
          >
            Customer Analytics
          </button>
          <Link
            href="/seller/products"
            className={isActive("/seller/products") ? styles.active : ""}
          >
            My Products
          </Link>
          <Link
            href="/seller/orders"
            className={isActive("/seller/orders") ? styles.active : ""}
          >
            Order History
          </Link>
          <Link
            href="/seller/GoLive"
            className={isActive("/seller/GoLive") ? styles.active : ""}
          >
            Go Live
          </Link>
        </>
      );
    }

    if (role === "new-seller") {
      return null;
    }

    if (role === "admin") {
      return (
        <>
          <Link
            href="/admin/users"
            className={isActive("/admin/users") ? styles.active : ""}
          >
            Manage Users
          </Link>
          <Link
            href="/admin/stores"
            className={isActive("/admin/stores") ? styles.active : ""}
          >
            Manage Stores
          </Link>
          <Link
            href="/admin/store-requests"
            className={isActive("/admin/store-requests") ? styles.active : ""}
          >
            Approve Stores
          </Link>
        </>
      );
    }

    // Default: guest or user
    return (
      <>
        <Link
          href="/user/products"
          className={isActive("/user/products") ? styles.active : ""}
        >
          Explore Products
        </Link>
        {role === "user" && (
          <Link
            href="/user/orders"
            className={isActive("/user/orders") ? styles.active : ""}
          >
            My Orders
          </Link>
        )}
        <Link
          href="/footer/quickLinks/about"
          className={isActive("/footer/quickLinks/about") ? styles.active : ""}
        >
          About Us
        </Link>
        {role === "user" && (
          <Link
            href="/user/LiveList"
            className={isActive("/user/LiveList") ? styles.active : ""}
          >
            Live
          </Link>
        )}
      </>
    );
  };

  // RIGHT ICONS
  const renderRightIcons = () => {
    if (!isRoleLoaded) return null;

    if (role === "admin" || role === "seller" || role === "new-seller") {
      return (
        <Link href="/profile">
          <User size={20} />
        </Link>
      );
    }

    if (role === "user") {
      return (
        <>
          <Link href="/user/cart">
            <ShoppingCart size={20} />
          </Link>
          <Link href="/user/wishlist">
            <Heart size={20} />
          </Link>
          <Link href="/profile">
            <User size={20} />
          </Link>
        </>
      );
    }

    // Guest — Login / Sign Up as a distinct white pill button
    return (
      <>
        <Link href="/user/cart">
          <ShoppingCart size={20} />
        </Link>
        <Link href="/user/wishlist">
          <Heart size={20} />
        </Link>
        <Link href="/authentication/auth" className={styles.loginBtn}>
          <User size={18} />
          <span>Login / Sign Up</span>
        </Link>
      </>
    );
  };

  return (
    <nav
      id="main-navbar"
      className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}
    >
      <div className={styles.navInner}>
        {/* LOGO — text only, no image */}
        <div className={styles.logoWrapper}>
          <Link href="/" className={styles.logoLink}>
            <span className={styles.logoText}>ShopSphere</span>
          </Link>
        </div>

        {/* CENTER LINKS */}
        <div
          className={`${styles.centerLinks} ${menuOpen ? styles.active : ""}`}
        >
          {renderCenterLinks()}
        </div>

        {/* RIGHT ICONS + HAMBURGER */}
        <div className={styles.icons}>
          {renderRightIcons()}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
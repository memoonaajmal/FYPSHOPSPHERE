"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCart, Heart, User, Menu, X } from "lucide-react";
import { useAuth } from "../src/context/AuthContext";
import { getAuth } from "firebase/auth";
import styles from "./styles/Navbar.module.css";

export default function Navbar() {
  const { user } = useAuth();
  const [role, setRole] = useState(null);
  const [isRoleLoaded, setIsRoleLoaded] = useState(false); // ✅ wait until role is determined
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // ---------- SCROLL LISTENER ----------
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ---------- CHECK ROLE AND STORE ----------
  useEffect(() => {
    const determineRole = async () => {
      if (!user) {
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
          // ✅ get Firebase token properly
          const auth = getAuth();
          const currentUser = auth.currentUser;
          const token = currentUser ? await currentUser.getIdToken() : null;

          if (!token) throw new Error("No Firebase token found");

          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL}/api/stores/check/exists`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
              credentials: "include",
            }
          );

          if (!res.ok) throw new Error("Unauthorized");

          const data = await res.json();

          if (data.hasStore) {
            setRole("seller"); // seller with store
          } else {
            setRole("new-seller"); // seller without store
          }
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
    };

    setIsRoleLoaded(false);
    determineRole();
  }, [user]);

  // ---------- SCROLL FUNCTIONS ----------
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

  // ---------- CENTER LINKS ----------
  const renderCenterLinks = () => {
    if (!isRoleLoaded) return null; // don't render anything until role is loaded

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
          <Link href="/seller/products">My Products</Link>
          <Link href="/seller/orders">Order History</Link>
          <Link href="/seller/GoLive">Go Live</Link>
        </>
      );
    }

    if (role === "new-seller") {
      return ;
    }

    if (role === "admin") {
      return (
        <>
          <Link href="/admin/users">Manage Users</Link>
          <Link href="/admin/stores">Manage Stores</Link>
          <Link href="/admin/store-requests">Approve Stores</Link>
        </>
      );
    }

    return (
      <>
        <Link href="/products">Explore Products</Link>
        {role === "user" && <Link href="/orders">My Orders</Link>}
        <Link href="/footer/quickLinks/about">About Us</Link>
                {role === "user" && <Link href="/LiveList">Live</Link>}

      </>
    );
  };

  // ---------- RIGHT ICONS ----------
  const renderRightIcons = () => {
    if (!isRoleLoaded) return null;

    if (role === "admin" || role === "seller" || role === "new-seller") {
      return (
        <div className={styles.icons}>
          <Link href="/profile">
            <User size={22} />
          </Link>
        </div>
      );
    }

    if (role === "user") {
      return (
        <div className={styles.icons}>
          <Link href="/cart">
            <ShoppingCart size={22} />
          </Link>
          <Link href="/wishlist">
            <Heart size={22} />
          </Link>
          <Link href="/profile">
            <User size={22} />
          </Link>
        </div>
      );
    }

    return (
      <div className={styles.icons}>
        <Link href="/cart">
          <ShoppingCart size={22} />
        </Link>
        <Link href="/wishlist">
          <Heart size={22} />
        </Link>
        <Link href="/auth">
          <User size={22} />
          <span>Login / Sign Up</span>
        </Link>
      </div>
    );
  };

  return (
    <nav
      id="main-navbar"
      className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}
    >
      <div className={styles.navBackground}></div>
      <div className={styles.navInner}>
        <div className={styles.logoWrapper}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src={`${process.env.NEXT_PUBLIC_BASE_URL.replace(
                /\/$/,
                ""
              )}/images/NavbarLogo.png`}
              alt="ShopSphere Logo"
              width={40}
              height={40}
              className={styles.logoImg}
              priority
            />
            <span className={styles.logoText}>ShopSphere</span>
          </Link>
        </div>

        {/* ---------- CENTER LINKS ---------- */}
        <div className={`${styles.centerLinks} ${menuOpen ? styles.active : ""}`}>
          {renderCenterLinks()}
        </div>

        {/* ---------- RIGHT ICONS + HAMBURGER ---------- */}
        <div className={styles.icons}>
          {renderRightIcons()}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </nav>
  );
}

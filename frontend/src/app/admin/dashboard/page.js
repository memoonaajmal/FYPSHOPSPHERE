"use client";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import Link from "next/link";
import styles from "../styles/AdminDashboard.module.css";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register the plugin once
gsap.registerPlugin(ScrollTrigger);

export default function AdminDashboard() {
  const dashboardRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate title when page loads
      gsap.from(`.${styles.title}`, {
        y: -40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      // Animate cards with a stagger effect
      gsap.from(`.${styles.card}`, {
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: `.${styles.grid}`,
          start: "top 85%",
        },
      });

      // Hover animation for cards
      const cards = gsap.utils.toArray(`.${styles.card}`);
      cards.forEach((card) => {
        card.addEventListener("mouseenter", () => {
          gsap.to(card, { scale: 1.05, duration: 0.3, ease: "power2.out" });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, { scale: 1, duration: 0.3, ease: "power2.out" });
        });
      });
    }, dashboardRef);

    return () => ctx.revert(); // Cleanup animations on unmount
  }, []);

  return (
    <ProtectedRoute role="admin">
      <div ref={dashboardRef} className={styles.dashboard}>
        <h1 className={styles.title}>Admin Dashboard</h1>

        <div className={styles.grid}>
          {/* User Management Box */}
          <Link href="/admin/users">
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>User Management</h2>
              <p className={styles.cardText}>
                View and manage users, roles, and their order history.
              </p>
            </div>
          </Link>

          {/* Store Management Box */}
          <Link href="/admin/stores">
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Store Management</h2>
              <p className={styles.cardText}>
                Approve sellers, manage stores, and monitor their performance.
              </p>
            </div>
          </Link>

          {/* Store Requests Box */}
          <Link href="/admin/store-requests">
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Create Store Requests</h2>
              <p className={styles.cardText}>
                View all seller store requests and approve or reject them.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </ProtectedRoute>
  );
}

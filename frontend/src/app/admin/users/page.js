"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import styles from "../styles/AllUser.module.css";
import gsap from "gsap";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/admin/users`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
        else if (data?.users && Array.isArray(data.users)) setUsers(data.users);
        else setUsers([]);
      })
      .catch((err) => console.error("Error fetching users", err));
  }, []);

  const normalUsers = users.filter((u) =>
    Array.isArray(u.roles) ? u.roles.includes("user") : u.roles === "user"
  );
  const storeOwners = users.filter((u) =>
    Array.isArray(u.roles) ? u.roles.includes("seller") : u.roles === "seller"
  );

  // ✅ GSAP Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animations
      gsap.from(`.${styles.title}`, {
        y: -30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(`.${styles.subtitle}`, {
        x: -30,
        opacity: 0,
        duration: 0.7,
        stagger: 0.3,
        ease: "power3.out",
        delay: 0.3,
      });

      // Table fade-in
      gsap.from(`.${styles.tableWrapper}`, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
        delay: 0.5,
      });

      // ✅ Animate table rows one-by-one
      gsap.from(`.${styles.row}`, {
        opacity: 0,
        y: 20,
        stagger: 0.08,
        duration: 0.5,
        ease: "power2.out",
        delay: 0.8,
      });

      // ✅ Subtle column shimmer
      const ths = gsap.utils.toArray(`.${styles.th}`);
      gsap.from(ths, {
        opacity: 0,
        x: -20,
        stagger: 0.05,
        duration: 0.4,
        ease: "power1.out",
        delay: 0.6,
      });

      // ✅ Hover animation for rows
      const rows = gsap.utils.toArray(`.${styles.row}`);
      rows.forEach((row) => {
        row.addEventListener("mouseenter", () => {
          gsap.to(row, { backgroundColor: "#f9fafb", duration: 0.3 });
        });
        row.addEventListener("mouseleave", () => {
          gsap.to(row, { backgroundColor: "#ffffff", duration: 0.3 });
        });
      });

      // ✅ Button hover animations
      const buttons = gsap.utils.toArray(`.${styles.button}`);
      buttons.forEach((btn) => {
        btn.addEventListener("mouseenter", () => {
          gsap.to(btn, {
            scale: 1.05,
            backgroundColor: "var(--carob)",
            color: "#fff",
            duration: 0.3,
          });
        });
        btn.addEventListener("mouseleave", () => {
          gsap.to(btn, {
            scale: 1,
            backgroundColor: "var(--matcha)",
            color: "#111",
            duration: 0.3,
          });
        });
      });
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <h1 className={styles.title}>User Management</h1>

      {/* Users Table */}
      <h2 className={styles.subtitle}>Users</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.theadRow}>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Role(s)</th>
              <th className={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {normalUsers.map((user) => (
              <tr key={user._id} className={styles.row}>
                <td className={styles.td}>{user.name}</td>
                <td className={styles.td}>{user.email}</td>
                <td className={styles.td}>
                  {Array.isArray(user.roles)
                    ? user.roles.join(", ")
                    : user.roles}
                </td>
                <td className={styles.td}>
                  <Link href={`/admin/users/${user._id}`}>
                    <button className={styles.button}>View Details</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Store Owners Table */}
      <h2 className={styles.subtitle}>Store Owners</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.theadRow}>
              <th className={styles.th}>Name</th>
              <th className={styles.th}>Email</th>
              <th className={styles.th}>Role(s)</th>
              <th className={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {storeOwners.map((user) => (
              <tr key={user._id} className={styles.row}>
                <td className={styles.td}>{user.name}</td>
                <td className={styles.td}>{user.email}</td>
                <td className={styles.td}>
                  {Array.isArray(user.roles)
                    ? user.roles.join(", ")
                    : user.roles}
                </td>
                <td className={styles.td}>
                  <Link href={`/admin/users/${user._id}`}>
                    <button className={styles.button}>View Details</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

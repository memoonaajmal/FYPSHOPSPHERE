"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "../../../styles/AllUser.module.css";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL; 

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/admin/users`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);

        if (Array.isArray(data)) {
          setUsers(data);
        } else if (data && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          setUsers([]);
        }
      })
      .catch((err) => console.error("Error fetching users", err));
  }, []);

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>User Management</h1>

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
          {users.map((user) => (
            <tr key={user._id} className={styles.row}>
              <td className={styles.td}>{user.name}</td>
              <td className={styles.td}>{user.email}</td>
              <td className={styles.td}>
                {Array.isArray(user.roles) ? user.roles.join(", ") : user.roles}
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
  );
}

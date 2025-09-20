"use client";

import styles from "./styles/UserDetails.module.css";

export default function UserDetails({ user }) {
  if (!user) {
    return <p className={styles.wrapper}>No user data available.</p>;
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>{user.name} - Details</h1>

      <p className={styles.info}>
        <span className={styles.label}>Email:</span> {user.email}
      </p>

      <p className={styles.info}>
        <span className={styles.label}>Roles:</span>{" "}
        {Array.isArray(user.roles) ? user.roles.join(", ") : user.roles}
      </p>

      <p className={styles.info}>
        <span className={styles.label}>Created At:</span>{" "}
        {user.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}
      </p>

      <p className={styles.info}>
        <span className={styles.label}>Updated At:</span>{" "}
        {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "N/A"}
      </p>
    </div>
  );
}

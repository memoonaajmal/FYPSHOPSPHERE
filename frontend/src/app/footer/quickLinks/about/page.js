"use client";
import Link from "next/link";
import styles from "../../../../styles/footerAboutPage.module.css";

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>About Us</h1>
      <p className={styles.text}>
        ShopSphere is your ultimate online marketplace combining live commerce,
        AI-driven shopping assistance, and augmented reality experiences.
        Our mission is to provide a seamless, interactive, and personalized
        shopping experience for every customer.
      </p>
      <Link href="/" className={styles.heroButton}>
        Back to Home
      </Link>
    </div>
  );
}

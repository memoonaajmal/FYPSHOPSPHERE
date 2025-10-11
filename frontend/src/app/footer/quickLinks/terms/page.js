"use client";
import Link from "next/link";
import styles from "../../../../styles/footerAboutPage.module.css";

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Terms & Conditions</h1>
      <p className={styles.text}>
        By using ShopSphere, you agree to our terms and conditions, including
        rules regarding account usage, purchases, refunds, and intellectual
        property rights. Please read carefully before using our platform.
      </p>
      <Link href="/" className={styles.heroButton}>
        Back to Home
      </Link>
    </div>
  );
}

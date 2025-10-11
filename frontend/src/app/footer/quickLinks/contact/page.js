"use client";
import Link from "next/link";
import styles from "../../../../styles/footerAboutPage.module.css";

export default function ContactPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Contact Us</h1>
      <p className={styles.text}>
        Have questions or feedback? Reach out to us via email at{" "}
        <a href="mailto:support@shopsphere.com">support@shopsphere.com</a> or
        call us at +92 300 0000000. We’re here to help!
      </p>
      <Link href="/" className={styles.heroButton}>
        Back to Home
      </Link>
    </div>
  );
}

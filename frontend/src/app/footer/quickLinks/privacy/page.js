"use client";
import Link from "next/link";
import styles from "../../../../styles/footerAboutPage.module.css";
export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Privacy Policy</h1>
      <p className={styles.text}>
        Your privacy is important to us. ShopSphere collects and uses data
        responsibly to enhance your shopping experience. We do not share your
        personal information with third parties without your consent.
      </p>
      <Link href="/" className={styles.heroButton}>
        Back to Home
      </Link>
    </div>
  );
}

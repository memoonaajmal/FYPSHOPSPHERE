"use client";
import Link from "next/link";
import styles from "../../../../styles/footerAboutPage.module.css";

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroShapes}>
          <div className={styles.shape1}></div>
          <div className={styles.shape2}></div>
          <div className={styles.shape3}></div>
          <div className={styles.shape4}></div>
        </div>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.heading}>Privacy Policy</h1>
          <p className={styles.tagline}>
            Your Privacy, Our Priority
          </p>
          <div className={styles.heroBadges}>
            <span className={styles.badge}>Secure</span>
            <span className={styles.badge}>Transparent</span>
            <span className={styles.badge}>GDPR Compliant</span>
          </div>
        </div>
      </div>

      {/* Introduction Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Our Commitment to Your Privacy</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.missionCard}>
          <p className={styles.text}>
            At <span className={styles.highlight}>ShopSphere</span>, your privacy is of utmost importance to us. 
            This Privacy Policy outlines how we collect, use, protect, and share your personal information 
            when you use our platform. We are committed to maintaining the highest standards of data 
            protection and transparency in all our operations.
          </p>
          <p className={styles.text}>
            Last Updated: <strong>January 2025</strong>
          </p>
        </div>
      </section>

      {/* Privacy Points Grid */}
      <section className={`${styles.section} ${styles.featuresSection}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Key Privacy Highlights</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.featuresGrid}>
          
          <div className={`${styles.featureCard} ${styles.feature1}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>🔒</div>
            </div>
            <h3 className={styles.featureTitle}>Data Protection</h3>
            <p className={styles.featureText}>
              We use industry-standard encryption and security measures to protect your personal 
              information from unauthorized access, disclosure, or misuse.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature2}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>👤</div>
            </div>
            <h3 className={styles.featureTitle}>Your Control</h3>
            <p className={styles.featureText}>
              You have full control over your data. Access, update, or delete your information 
              anytime through your account settings or by contacting our support team.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature3}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>🚫</div>
            </div>
            <h3 className={styles.featureTitle}>No Selling Data</h3>
            <p className={styles.featureText}>
              We never sell your personal information to third parties. Your data is used solely 
              to enhance your shopping experience on our platform.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature4}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>📊</div>
            </div>
            <h3 className={styles.featureTitle}>Transparent Usage</h3>
            <p className={styles.featureText}>
              We clearly communicate what data we collect and why. Every piece of information 
              serves a specific purpose in improving your experience.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature5}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>🍪</div>
            </div>
            <h3 className={styles.featureTitle}>Cookie Management</h3>
            <p className={styles.featureText}>
              You can control cookie preferences through your browser settings. We use cookies 
              to personalize your experience and analyze platform performance.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature6}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>✉️</div>
            </div>
            <h3 className={styles.featureTitle}>Communication Preferences</h3>
            <p className={styles.featureText}>
              Opt-in or opt-out of marketing communications anytime. We respect your choices 
              and will only contact you based on your preferences.
            </p>
          </div>

        </div>
      </section>

      {/* Detailed Information Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Information We Collect</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.visionContent}>
          <p className={styles.text}>
            We collect different types of information to provide and improve our services:
          </p>
          <ul className={styles.visionList}>
            <li className={styles.vision1}>
              <span className={styles.visionIcon}>📝</span>
              <strong>Account Information:</strong> Name, email address, phone number, and billing details when you create an account
            </li>
            <li className={styles.vision2}>
              <span className={styles.visionIcon}>🛒</span>
              <strong>Shopping Data:</strong> Purchase history, browsing behavior, product preferences, and cart information
            </li>
            <li className={styles.vision3}>
              <span className={styles.visionIcon}>📱</span>
              <strong>Device Information:</strong> IP address, browser type, device identifiers, and operating system
            </li>
            <li className={styles.vision4}>
              <span className={styles.visionIcon}>📍</span>
              <strong>Location Data:</strong> Shipping addresses and general location for delivery purposes
            </li>
            <li className={styles.vision5}>
              <span className={styles.visionIcon}>🎥</span>
              <strong>AR & Voice Data:</strong> Images for virtual try-on and voice commands for voice ordering (processed securely and not stored permanently)
            </li>
          </ul>
        </div>
      </section>

      {/* How We Use Data Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How We Use Your Information</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.visionContent}>
          <p className={styles.text}>
            Your information helps us deliver exceptional service and personalized experiences:
          </p>
          <ul className={styles.visionList}>
            <li className={styles.vision1}>
              <span className={styles.visionIcon}>✅</span>
              <strong>Process Transactions:</strong> Complete purchases, process payments, and deliver orders
            </li>
            <li className={styles.vision2}>
              <span className={styles.visionIcon}>🎯</span>
              <strong>Personalization:</strong> Provide AI-powered recommendations and customized shopping experiences
            </li>
            <li className={styles.vision3}>
              <span className={styles.visionIcon}>🛡️</span>
              <strong>Security:</strong> Prevent fraud, protect accounts, and maintain platform security
            </li>
            <li className={styles.vision4}>
              <span className={styles.visionIcon}>📧</span>
              <strong>Communication:</strong> Send order updates, customer support responses, and promotional offers (with consent)
            </li>
            <li className={styles.vision5}>
              <span className={styles.visionIcon}>📈</span>
              <strong>Improvement:</strong> Analyze usage patterns to enhance features and user experience
            </li>
          </ul>
        </div>
      </section>

      {/* Your Rights Section */}
      <section className={styles.section}>
        <div className={styles.techCard}>
          <div className={styles.techIcon}>⚖️</div>
          <h2 className={styles.techTitle}>Your Rights & Choices</h2>
          <p className={styles.techText}>
            You have the right to access, correct, or delete your personal data. You can also 
            object to processing, request data portability, and withdraw consent at any time. 
            For GDPR and CCPA compliance inquiries, or to exercise your rights, please contact 
            our privacy team at <strong>privacy@shopsphere.com</strong>. We respond to all 
            requests within 30 days.
          </p>
        </div>
      </section>

      {/* Data Security Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Data Security Measures</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.missionCard}>
          <p className={styles.text}>
            We implement <span className={styles.highlight}>robust security measures</span> including:
          </p>
          <p className={styles.text}>
            • SSL/TLS encryption for all data transmission<br/>
            • Secure payment processing through PCI-DSS compliant providers<br/>
            • Regular security audits and vulnerability assessments<br/>
            • Access controls and authentication protocols<br/>
            • Data backup and disaster recovery procedures<br/>
            • Employee training on data protection and privacy
          </p>
        </div>
      </section>

      {/* Third Party Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Third-Party Services</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.missionCard}>
          <p className={styles.text}>
            We may share your information with trusted third-party service providers who assist 
            us in operating our platform, such as:
          </p>
          <p className={styles.text}>
            • <strong>Payment processors</strong> for secure transaction handling<br/>
            • <strong>Shipping partners</strong> for order delivery<br/>
            • <strong>Cloud service providers</strong> for data storage<br/>
            • <strong>Analytics services</strong> for platform improvement<br/>
            • <strong>Marketing platforms</strong> for promotional communications (with your consent)
          </p>
          <p className={styles.text}>
            All third parties are contractually obligated to protect your data and use it only 
            for the specified purposes.
          </p>
        </div>
      </section>

      {/* Updates Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Policy Updates</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.missionCard}>
          <p className={styles.text}>
            We may update this Privacy Policy periodically to reflect changes in our practices 
            or legal requirements. We will notify you of significant changes via email or a 
            prominent notice on our platform. Your continued use of ShopSphere after such 
            modifications constitutes acceptance of the updated policy.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaShapes}>
          <div className={styles.ctaShape1}></div>
          <div className={styles.ctaShape2}></div>
          <div className={styles.ctaShape3}></div>
        </div>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Questions About Privacy?</h2>
          <p className={styles.ctaText}>
            If you have any questions or concerns about our privacy practices, 
            we're here to help.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className={styles.heroButton}>
              <span>Back to Home</span>
              <span className={styles.buttonArrow}>→</span>
            </Link>
            <Link href="/footer/quickLinks/contact" className={styles.heroButton}>
              <span>Contact Us</span>
              <span className={styles.buttonArrow}>✉️</span>
            </Link>
          </div>
        </div>
        <div className={styles.ctaDecoration}></div>
      </section>
    </div>
  );
}
"use client";
import Link from "next/link";
import styles from "../../../../styles/footerAboutPage.module.css";

export default function TermsPage() {
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
          <h1 className={styles.heading}>Terms & Conditions</h1>
          <p className={styles.tagline}>
            Clear Guidelines for a Better Shopping Experience
          </p>
          <div className={styles.heroBadges}>
            <span className={styles.badge}>Fair Terms</span>
            <span className={styles.badge}>User Rights</span>
            <span className={styles.badge}>Legal Protection</span>
          </div>
        </div>
      </div>

      {/* Introduction Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Agreement Overview</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.missionCard}>
          <p className={styles.text}>
            Welcome to <span className={styles.highlight}>ShopSphere</span>! By accessing or using our platform, 
            you agree to be bound by these Terms and Conditions. These terms govern your use of our 
            e-commerce marketplace, including all features such as AR virtual try-on, live commerce, 
            AI-powered assistance, and voice ordering.
          </p>
          <p className={styles.text}>
            Please read these terms carefully before using our services. If you do not agree with 
            any part of these terms, you should not use ShopSphere.
          </p>
          <p className={styles.text}>
            Last Updated: <strong>January 2025</strong>
          </p>
        </div>
      </section>

      {/* Key Terms Grid */}
      <section className={`${styles.section} ${styles.featuresSection}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Key Terms at a Glance</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.featuresGrid}>
          
          <div className={`${styles.featureCard} ${styles.feature1}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>👤</div>
            </div>
            <h3 className={styles.featureTitle}>Account Usage</h3>
            <p className={styles.featureText}>
              You must be 18+ to create an account. You're responsible for maintaining 
              account security and all activities under your account.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature2}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>💳</div>
            </div>
            <h3 className={styles.featureTitle}>Purchases & Payments</h3>
            <p className={styles.featureText}>
              All prices are in USD unless stated otherwise. Payment must be received before 
              order processing. We accept major credit cards and secure payment methods.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature3}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>↩️</div>
            </div>
            <h3 className={styles.featureTitle}>Returns & Refunds</h3>
            <p className={styles.featureText}>
              30-day return policy for most items. Products must be unused and in original 
              packaging. Refunds processed within 5-7 business days.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature4}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>©️</div>
            </div>
            <h3 className={styles.featureTitle}>Intellectual Property</h3>
            <p className={styles.featureText}>
              All content on ShopSphere is protected by copyright and trademark laws. 
              Unauthorized use of our materials is strictly prohibited.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature5}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>🚫</div>
            </div>
            <h3 className={styles.featureTitle}>Prohibited Activities</h3>
            <p className={styles.featureText}>
              No fraudulent activities, spam, harassment, or misuse of our platform. 
              Violations may result in account suspension or termination.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature6}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>⚖️</div>
            </div>
            <h3 className={styles.featureTitle}>Liability Limits</h3>
            <p className={styles.featureText}>
              We provide our platform "as is" and are not liable for indirect damages. 
              Our liability is limited to the amount paid for products.
            </p>
          </div>

        </div>
      </section>

      {/* Account Terms Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Account Registration & Usage</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.visionContent}>
          <p className={styles.text}>
            When you create a ShopSphere account, you agree to:
          </p>
          <ul className={styles.visionList}>
            <li className={styles.vision1}>
              <span className={styles.visionIcon}>✅</span>
              <strong>Eligibility:</strong> Be at least 18 years old or have parental/guardian consent
            </li>
            <li className={styles.vision2}>
              <span className={styles.visionIcon}>📝</span>
              <strong>Accurate Information:</strong> Provide truthful, current, and complete information during registration
            </li>
            <li className={styles.vision3}>
              <span className={styles.visionIcon}>🔐</span>
              <strong>Security:</strong> Maintain the confidentiality of your password and account credentials
            </li>
            <li className={styles.vision4}>
              <span className={styles.visionIcon}>⚠️</span>
              <strong>Responsibility:</strong> Accept responsibility for all activities that occur under your account
            </li>
            <li className={styles.vision5}>
              <span className={styles.visionIcon}>🚨</span>
              <strong>Notification:</strong> Immediately notify us of any unauthorized access or security breaches
            </li>
          </ul>
        </div>
      </section>

      {/* Purchases & Payments Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Purchases, Payments & Pricing</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.missionCard}>
          <p className={styles.text}>
            <strong>Pricing:</strong> All prices displayed on ShopSphere are in USD unless otherwise stated. 
            We reserve the right to change prices at any time without prior notice. However, price changes 
            will not affect orders already placed.
          </p>
          <p className={styles.text}>
            <strong>Payment:</strong> Payment must be received before order processing begins. We accept 
            major credit cards, debit cards, and other secure payment methods as displayed at checkout. 
            By providing payment information, you confirm that you are authorized to use the payment method.
          </p>
          <p className={styles.text}>
            <strong>Order Confirmation:</strong> After placing an order, you will receive a confirmation 
            email. This confirms that we have received your order but does not constitute acceptance. 
            We reserve the right to refuse any order for any reason.
          </p>
          <p className={styles.text}>
            <strong>Taxes & Fees:</strong> Prices may not include applicable taxes, shipping fees, or 
            handling charges, which will be clearly displayed at checkout before payment.
          </p>
        </div>
      </section>

      {/* Returns & Refunds Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Returns, Refunds & Cancellations</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.visionContent}>
          <p className={styles.text}>
            We want you to be completely satisfied with your purchase:
          </p>
          <ul className={styles.visionList}>
            <li className={styles.vision1}>
              <span className={styles.visionIcon}>📅</span>
              <strong>30-Day Return Policy:</strong> Most items can be returned within 30 days of delivery
            </li>
            <li className={styles.vision2}>
              <span className={styles.visionIcon}>📦</span>
              <strong>Return Conditions:</strong> Items must be unused, unworn, and in original packaging with all tags attached
            </li>
            <li className={styles.vision3}>
              <span className={styles.visionIcon}>💰</span>
              <strong>Refund Processing:</strong> Refunds are processed within 5-7 business days after receiving the returned item
            </li>
            <li className={styles.vision4}>
              <span className={styles.visionIcon}>🚚</span>
              <strong>Return Shipping:</strong> Return shipping costs are the customer's responsibility unless the item is defective
            </li>
            <li className={styles.vision5}>
              <span className={styles.visionIcon}>❌</span>
              <strong>Non-Returnable Items:</strong> Certain items like personalized products, intimate apparel, and sale items may not be eligible for return
            </li>
          </ul>
        </div>
      </section>

      {/* Intellectual Property Section */}
      <section className={styles.section}>
        <div className={styles.techCard}>
          <div className={styles.techIcon}>©️</div>
          <h2 className={styles.techTitle}>Intellectual Property Rights</h2>
          <p className={styles.techText}>
            All content on ShopSphere, including text, graphics, logos, images, videos, audio clips, 
            digital downloads, data compilations, and software, is the property of ShopSphere or its 
            content suppliers and is protected by international copyright, trademark, patent, trade 
            secret, and other intellectual property laws. You may not reproduce, distribute, modify, 
            create derivative works, publicly display, or exploit any content without our express 
            written permission.
          </p>
        </div>
      </section>

      {/* Prohibited Activities Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Prohibited Uses</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.missionCard}>
          <p className={styles.text}>
            You agree not to use ShopSphere for any of the following purposes:
          </p>
          <p className={styles.text}>
            • Violating any local, state, national, or international law<br/>
            • Infringing intellectual property rights<br/>
            • Transmitting harmful code (viruses, malware, etc.)<br/>
            • Engaging in fraudulent activities or impersonating others<br/>
            • Harassing, threatening, or abusing other users<br/>
            • Scraping or data mining without permission<br/>
            • Interfering with platform security or functionality<br/>
            • Creating multiple accounts to manipulate reviews or ratings<br/>
            • Reselling products for commercial purposes without authorization
          </p>
        </div>
      </section>

      {/* Limitation of Liability Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Limitation of Liability</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.missionCard}>
          <p className={styles.text}>
            ShopSphere and its affiliates, officers, employees, agents, partners, and licensors shall 
            not be liable for any indirect, incidental, special, consequential, or punitive damages, 
            including without limitation, loss of profits, data, use, goodwill, or other intangible 
            losses, resulting from:
          </p>
          <p className={styles.text}>
            • Your access to or use of (or inability to access or use) the platform<br/>
            • Any conduct or content of any third party on the platform<br/>
            • Unauthorized access, use, or alteration of your content<br/>
            • Product defects or service interruptions
          </p>
          <p className={styles.text}>
            Our total liability is limited to the amount you paid for the specific product or service 
            in question, or $100, whichever is less.
          </p>
        </div>
      </section>

      {/* Dispute Resolution Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Dispute Resolution & Governing Law</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.missionCard}>
          <p className={styles.text}>
            <strong>Governing Law:</strong> These Terms shall be governed by and construed in accordance 
            with the laws of the United States, without regard to its conflict of law provisions.
          </p>
          <p className={styles.text}>
            <strong>Arbitration:</strong> Any disputes arising from these Terms or your use of ShopSphere 
            shall be resolved through binding arbitration rather than in court, except where prohibited 
            by law. You agree to waive your right to a jury trial or to participate in a class action.
          </p>
          <p className={styles.text}>
            <strong>Informal Resolution:</strong> Before filing any claim, you agree to contact us to 
            seek an informal resolution of the dispute.
          </p>
        </div>
      </section>

      {/* Changes to Terms Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Changes to Terms</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.missionCard}>
          <p className={styles.text}>
            We reserve the right to modify or replace these Terms at any time at our sole discretion. 
            If a revision is material, we will provide at least 30 days' notice before any new terms 
            take effect. What constitutes a material change will be determined at our sole discretion.
          </p>
          <p className={styles.text}>
            By continuing to access or use ShopSphere after revisions become effective, you agree to 
            be bound by the revised terms. If you do not agree to the new terms, please stop using 
            the platform.
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className={styles.section}>
        <div className={styles.techCard}>
          <div className={styles.techIcon}>📧</div>
          <h2 className={styles.techTitle}>Contact Information</h2>
          <p className={styles.techText}>
            If you have any questions about these Terms and Conditions, please contact us. 
            We're here to help clarify any concerns you may have about your rights and responsibilities 
            as a ShopSphere user.
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
          <h2 className={styles.ctaTitle}>Ready to Start Shopping?</h2>
          <p className={styles.ctaText}>
            By using ShopSphere, you acknowledge that you have read and agree to these terms.
          </p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className={styles.heroButton}>
              <span>Back to Home</span>
              <span className={styles.buttonArrow}>→</span>
            </Link>
            <Link href="/footer/quickLinks/privacy" className={styles.heroButton}>
              <span>Privacy Policy</span>
              <span className={styles.buttonArrow}>🔒</span>
            </Link>
          </div>
        </div>
        <div className={styles.ctaDecoration}></div>
      </section>
    </div>
  );
}
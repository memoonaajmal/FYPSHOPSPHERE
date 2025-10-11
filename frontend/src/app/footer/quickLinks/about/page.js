"use client";
import Link from "next/link";
import styles from "../../../../styles/footerAboutPage.module.css";

export default function AboutPage() {
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
          <h1 className={styles.heading}>About ShopSphere</h1>
          <p className={styles.tagline}>
            Revolutionizing E-Commerce Through Innovation
          </p>
          <div className={styles.heroBadges}>
            <span className={styles.badge}>AI Powered</span>
            <span className={styles.badge}>AR Enabled</span>
            <span className={styles.badge}>Live Commerce</span>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Our Mission</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.missionCard}>
          <p className={styles.text}>
            ShopSphere is your ultimate online marketplace that combines cutting-edge 
            technology with seamless shopping experiences. We're on a mission to transform 
            digital commerce by integrating <span className={styles.highlight}>Augmented Reality (AR)</span>, 
            <span className={styles.highlight}> Artificial Intelligence (AI)</span>, and <span className={styles.highlight}>Live Commerce</span> 
            to create an interactive, personalized, and trustworthy shopping platform.
          </p>
          <p className={styles.text}>
            Our goal is to bridge the gap between online and offline shopping, providing 
            customers with the confidence and convenience they deserve while making every 
            purchase decision intuitive and informed.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className={`${styles.section} ${styles.featuresSection}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Revolutionary Features</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.featuresGrid}>
          
          <div className={`${styles.featureCard} ${styles.feature1}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>🥽</div>
            </div>
            <h3 className={styles.featureTitle}>AR Virtual Try-On</h3>
            <p className={styles.featureText}>
              Experience products before you buy with our augmented reality technology. 
              See 3D models of accessories positioned on your real-time selfie, making 
              confident purchase decisions easier than ever.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature2}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>📹</div>
            </div>
            <h3 className={styles.featureTitle}>Live Commerce</h3>
            <p className={styles.featureText}>
              Connect directly with our agents through high-definition live video sessions. 
              Get real-time product demonstrations, expert advice, and personalized 
              shopping assistance that mirrors in-store experiences.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature3}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>🤖</div>
            </div>
            <h3 className={styles.featureTitle}>AI-Powered Chatbot</h3>
            <p className={styles.featureText}>
              Our intelligent chatbot understands your needs, answers queries instantly, 
              recommends relevant products, and assists you throughout your shopping 
              journey with natural, conversational interactions.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature4}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>🎤</div>
            </div>
            <h3 className={styles.featureTitle}>Voice Ordering</h3>
            <p className={styles.featureText}>
              Shop hands-free with voice commands. Browse products, add items to cart, 
              and complete purchases using just your voice for ultimate convenience 
              and accessibility.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature5}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>✨</div>
            </div>
            <h3 className={styles.featureTitle}>Smart Recommendations</h3>
            <p className={styles.featureText}>
              Discover products tailored to your preferences. Our AI analyzes your 
              browsing history and behavior to suggest items you'll love, making 
              every shopping session personalized and efficient.
            </p>
          </div>

          <div className={`${styles.featureCard} ${styles.feature6}`}>
            <div className={styles.featureIconWrapper}>
              <div className={styles.featureIcon}>📦</div>
            </div>
            <h3 className={styles.featureTitle}>Order Management</h3>
            <p className={styles.featureText}>
              Track and organize your purchase history effortlessly. Our AI-powered 
              system lets you sort orders by date and category, making it simple to 
              review past purchases and reorder favorites.
            </p>
          </div>

        </div>
      </section>

      {/* Vision Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Our Vision</h2>
          <div className={styles.titleUnderline}></div>
        </div>
        <div className={styles.visionContent}>
          <p className={styles.text}>
            As the digital landscape continues to evolve, we recognize that enhancing 
            user experience in online shopping is no longer optional—it's essential. 
            ShopSphere represents the future of e-commerce, where technology meets 
            intuition to create shopping experiences that are:
          </p>
          <ul className={styles.visionList}>
            <li className={styles.vision1}>
              <span className={styles.visionIcon}>💡</span>
              <strong>Interactive:</strong> Engage with products in ways never before possible
            </li>
            <li className={styles.vision2}>
              <span className={styles.visionIcon}>🎯</span>
              <strong>Personalized:</strong> Receive recommendations that truly match your style
            </li>
            <li className={styles.vision3}>
              <span className={styles.visionIcon}>🔒</span>
              <strong>Trustworthy:</strong> Make confident decisions with AR visualization and live support
            </li>
            <li className={styles.vision4}>
              <span className={styles.visionIcon}>♿</span>
              <strong>Accessible:</strong> Shop your way, whether through touch, voice, or video
            </li>
            <li className={styles.vision5}>
              <span className={styles.visionIcon}>🌊</span>
              <strong>Seamless:</strong> Enjoy a unified experience across all touchpoints
            </li>
          </ul>
        </div>
      </section>

      {/* Technology Section */}
      <section className={`${styles.section} ${styles.techSection}`}>
        <div className={styles.techCard}>
          <div className={styles.techIcon}>🚀</div>
          <h2 className={styles.techTitle}>Powered by Innovation</h2>
          <p className={styles.techText}>
            ShopSphere leverages the latest advances in technology to deliver an 
            unparalleled shopping platform. Our commitment to innovation ensures that 
            every interaction is powered by sophisticated AI, immersive AR, and 
            real-time connectivity—creating a shopping environment that's both 
            responsive and delightful for modern digital consumers.
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
          <h2 className={styles.ctaTitle}>Experience the Future of Shopping</h2>
          <p className={styles.ctaText}>
            Join thousands of satisfied customers who have already discovered 
            the ShopSphere difference.
          </p>
          <Link href="/products" className={styles.heroButton}>
            <span>Start Shopping Now</span>
            <span className={styles.buttonArrow}>→</span>
          </Link>
        </div>
        <div className={styles.ctaDecoration}></div>
      </section>
    </div>
  );
}
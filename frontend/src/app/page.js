"use client";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ShoppingBag, Bot, Globe2, Sparkles} from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";



const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

function ParticleMesh() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    function resizeCanvas() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particles = [];
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // draw lines
      for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.strokeStyle = `rgba(0, 200, 255, ${1 - dist / 100})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // move particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.fillStyle = "rgba(0, 200, 255, 0.8)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    }

    animate();

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  return <canvas ref={canvasRef} className={styles.particleCanvas}></canvas>;
}

function HomeContent() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch(`${BASE_URL}/api/stores`);
        const data = await res.json();

        if (Array.isArray(data)) setStores(data);
        else if (data?.stores) setStores(data.stores);
        else setStores([]);
      } catch {
        setError("Failed to load stores.");
        setStores([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStores();

    const stored = localStorage.getItem("recentlyViewed");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentlyViewed(parsed);
        }
      } catch {
        console.error("Error parsing recently viewed data");
      }
    }
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray(`.${styles.featureCard}`).forEach((card, i) => {
      gsap.to(card, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: i * 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: card,
          start: "top 90%",
        },
      });
    });
  }, []);

  return (
    <div className={styles.container}>
      
      {/* Hero Section */}
  <section className={styles.hero}>
  <div className={styles.heroSlideshow}>
    <div className={`${styles.slide} ${styles.slide1}`}></div>
    <div className={`${styles.slide} ${styles.slide2}`}></div>
    <div className={`${styles.slide} ${styles.slide3}`}></div>
  </div>
  <div className={styles.heroOverlay}></div>
  <div className={styles.heroContent}>
    <h1 className={styles.heroTitle}>SHOPSPHERE</h1>
    <p className={styles.heroSubtitle}>
      Discover the best stores & exclusive collections
    </p>
    <Link href="/products" className={styles.heroButton}>
      Explore Products
    </Link>
  </div>
</section>


      {/* Stores Section */}
      <section id="stores" className={styles.storesSection}>
        <h2 className={styles.heading}>Our Stores</h2>
        {loading ? (
          <p>Loading stores...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : stores.length === 0 ? (
          <p>No stores found.</p>
        ) : (
          <>
            <div className={styles.scrollContainer}>
              <div className={styles.horizontalScroll}>
                {stores.slice(0, 4).map((store, index) => {
                  const bgImages = [
                    "/images/product1.jpg",
                    "/images/product4.jpg",
                    "/images/product2.jpg",
                    "/images/product3.jpg",
                  ];
                  return (
                    <Link
                      key={store._id}
                      href={`/stores/${store._id}`}
                      className={styles.storeCard}
                      style={{ backgroundImage: `url(${bgImages[index]})` }}
                    >
                      <div className={styles.storeOverlay}></div>
                      <h3 className={styles.storeName}>{store.name}</h3>
                      {Array.isArray(store.categories) &&
                        store.categories.length > 0 && (
                          <div className={styles.categories}>
                            {store.categories.map((cat, i) => (
                              <span key={i} className={styles.categoryBadge}>
                                {cat}
                              </span>
                            ))}
                          </div>
                        )}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className={styles.exploreAllWrapper}>
              <Link href="/allStores" className={styles.exploreAllButton}>
                Explore All Stores
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <section className={styles.recentlyViewedSection}>
          <h2 className={styles.heading}>Recently Viewed</h2>
          <div className={styles.productsGrid}>
            {recentlyViewed.map((product) => (
              <Link
                key={product._id}
                href={`/products/${product._id}`}
                className={styles.productCard}
              >
                <div className={styles.imageWrapper}>
                  <img
                    src={
                      `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}` ||
                      "/placeholder.png"
                    }
                    alt={product.productDisplayName}
                    className={styles.productImage}
                  />
                </div>
                <h3 className={styles.productName}>
                  {product.productDisplayName}
                </h3>
                <p className={styles.productPrice}>
                  {product.price ? `PKR ${product.price}` : "N/A"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Why Choose Section */}
      <section className={styles.whySection}>
        <h2 className={styles.heading}>Why Choose ShopSphere?</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <ParticleMesh />
          <ShoppingBag className={styles.icon} />
            <h3 className={styles.featureTitle}>Live Commerce Experience</h3>
            <p className={styles.featureDesc}>
              Experience shopping like never before! Watch your favorite sellers
              go live, explore real-time product demos, interact directly, and
              purchase instantly — all within one seamless experience.
            </p>
          </div>
          <div className={styles.featureCard}>
                <ParticleMesh />
           <Bot className={styles.icon} />
            <h3 className={styles.featureTitle}>AI Order Assistance</h3>
            <p className={styles.featureDesc}>
              Our AI intelligently understands your preferences, recommends the
              best products, manages your orders, and even predicts your next
              favorite buy — making shopping faster and smarter.
            </p>
          </div>
          <div className={styles.featureCard}>
                <ParticleMesh />
             <Globe2 className={styles.icon} />
            <h3 className={styles.featureTitle}>Augmented Reality Try-On</h3>
            <p className={styles.featureDesc}>
              Bring your products to life with AR! Virtually try furniture,
              clothing, or accessories in your space using your phone camera —
              ensuring perfect fits and confident purchases every time.
            </p>
          </div>
          <div className={styles.featureCard}>
                <ParticleMesh />
             <Sparkles className={styles.icon} />
            <h3 className={styles.featureTitle}>Shop Latest Trends</h3>
            <p className={styles.featureDesc}>
              Stay ahead of the curve with our “Shop Latest Trends” feature —
              explore what’s trending globally in real time. Discover curated
              collections, influencer picks, and new arrivals tailored to your
              taste.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        
        <div className={styles.footerContainer}>
          
          <div className={styles.footerBrand}>
            <h2 className={styles.logo}>ShopSphere</h2>
            <p className={styles.tagline}>
              Redefining shopping through innovation — AI, AR, and Live Commerce.
            </p>
          </div>
          <div className={styles.footerLinks}>
            <h3>Quick Links</h3>
            <Link href="/footer/quickLinks/about" className={styles.footerLink}>
              About Us
            </Link>
            <Link
              href="/footer/quickLinks/contact"
              className={styles.footerLink}
            >
              Contact
            </Link>
            <Link
              href="/footer/quickLinks/privacy"
              className={styles.footerLink}
            >
              Privacy Policy
            </Link>
            <Link
              href="/footer/quickLinks/terms"
              className={styles.footerLink}
            >
              Terms & Conditions
            </Link>
          </div>
          <div className={styles.footerSocials}>
            <h3>Follow Us</h3>
           <div className={styles.footerSocials}>

  <div className={styles.socialIcons}>
    <Link href="#" className={styles.icon}>
      <FaFacebookF />
    </Link>
    <Link href="#" className={styles.icon}>
      <FaInstagram />
    </Link>
    <Link href="#" className={styles.icon}>
      <FaTwitter />
    </Link>
    <Link href="#" className={styles.icon}>
      <FaLinkedinIn />
    </Link>
  </div>
</div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>
            &copy; {new Date().getFullYear()} <strong>ShopSphere</strong>. All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute role="user">
      <HomeContent />
    </ProtectedRoute>
  );
}

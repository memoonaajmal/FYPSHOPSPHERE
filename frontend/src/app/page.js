"use client";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ShoppingBag, Bot, Globe2, Sparkles } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import ProductCard from "../../components/ProductCard";
import { auth } from "../../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import Recommendations from "../../components/Recommendations";

import {
  Box, Typography, Grid, Chip, Button, IconButton, Divider, CircularProgress,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  white: "#ffffff",
  navy: "#26314a",
  blue: "#274690",
  blueLight: "#3e5ba9",
  blueVeryLight: "#6e82b8",
  blueSoft: "#f5f7ff",
  border: "#e8edf5",
  muted: "#8f9bb3",
  sectionAlt: "#f9fafc",
};

// ─── Keyframes ────────────────────────────────────────────────────────────────
const fadeSlide = keyframes`
  0%   { opacity: 0; }
  8%   { opacity: 1; }
  33%  { opacity: 1; }
  41%  { opacity: 0; }
  100% { opacity: 0; }
`;

// ─── Particle Mesh ────────────────────────────────────────────────────────────
function ParticleMesh() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const pts = Array.from({ length: 48 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.strokeStyle = `rgba(110,130,184,${(1 - d / 100) * 0.55})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
      }
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.fillStyle = "rgba(110,130,184,0.55)";
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}
    />
  );
}

// ─── Styled Components ────────────────────────────────────────────────────────
const Slide = styled(Box)(({ delay, image }) => ({
  position: "absolute", inset: 0,
  backgroundSize: "cover", backgroundPosition: "center",
  backgroundImage: `url('${image}')`, opacity: 0,
  animation: `${fadeSlide} 12s infinite`,
  animationDelay: `${delay}s`,
}));

const StoreCard = styled(Link)(({ bgimage }) => ({
  position: "relative", display: "flex", flexDirection: "column",
  justifyContent: "flex-end", width: "100%", height: "100%",
  borderRadius: 20, padding: "1.5rem",
  backgroundSize: "cover", backgroundPosition: "center",
  backgroundImage: `url('${bgimage}')`, textDecoration: "none",
  overflow: "hidden", boxShadow: "0 4px 20px rgba(39,70,144,0.12)",
  transition: "transform 0.35s ease, box-shadow 0.35s ease",
  "&:hover": { transform: "translateY(-6px) scale(1.01)", boxShadow: "0 14px 36px rgba(39,70,144,0.22)" },
}));

const FeatureCard = styled(Box)({
  background: "linear-gradient(140deg, #0c1b3f 0%, #1c3065 100%)",
  position: "relative", overflow: "hidden", padding: "2rem 1.8rem",
  borderRadius: 20, border: "1px solid rgba(110,130,184,0.12)",
  boxShadow: "0 6px 28px rgba(10,20,60,0.16)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": { transform: "translateY(-7px)", boxShadow: "0 14px 44px rgba(39,70,144,0.28)" },
});

const Eyebrow = styled(Typography)({
  display: "inline-block", fontSize: "0.7rem", fontWeight: 700,
  letterSpacing: "0.2em", textTransform: "uppercase",
  color: C.blueLight, backgroundColor: "#e8eeff",
  borderRadius: 30, padding: "4px 14px", marginBottom: "0.5rem",
});

const SocialBtn = styled(IconButton)({
  background: "rgba(255,255,255,0.07)", color: C.white,
  width: 38, height: 38, border: "1px solid rgba(255,255,255,0.1)",
  transition: "all 0.28s ease",
  "&:hover": { background: C.white, color: "#0b1838", transform: "translateY(-4px)" },
});

const PrimaryBtn = styled(Button)({
  background: `linear-gradient(135deg, ${C.blue} 0%, ${C.blueLight} 100%)`,
  color: C.white, borderRadius: 40, fontWeight: 700, textTransform: "none",
  fontSize: "0.95rem", padding: "0.7rem 2rem",
  boxShadow: "0 4px 16px rgba(39,70,144,0.28)", transition: "all 0.3s ease",
  "&:hover": {
    background: `linear-gradient(135deg, ${C.blueLight} 0%, ${C.blue} 100%)`,
    transform: "translateY(-2px)", boxShadow: "0 8px 26px rgba(39,70,144,0.38)",
  },
});

const ProductCardWrapper = styled(Box)({
  width: "100%", display: "flex", flexDirection: "column",
  borderRadius: 16, overflow: "hidden",
  boxShadow: "0 4px 18px rgba(39,70,144,0.09)",
  backgroundColor: C.white,
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": { transform: "translateY(-5px)", boxShadow: "0 10px 30px rgba(39,70,144,0.16)" },
  "& > *": { width: "100% !important", maxWidth: "none !important" },
});

// ─── Shared Layout ────────────────────────────────────────────────────────────
const sxPad = { px: { xs: 2, sm: 3, md: 5 }, py: { xs: 7, md: 10 } };
const sxInner = { width: "100%", maxWidth: 1400, mx: "auto" };
const sxHeading = { textAlign: "center", mb: 6 };

// ─── Main ─────────────────────────────────────────────────────────────────────
function HomeContent() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) setToken(await user.getIdToken());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchStores() {
      try {
        const res = await fetch(`${BASE_URL}/api/stores`);
        const data = await res.json();
        setStores(Array.isArray(data) ? data : data?.stores ?? []);
      } catch { setError("Failed to load stores."); setStores([]); }
      finally { setLoading(false); }
    }
    fetchStores();
    try {
      const parsed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
      if (Array.isArray(parsed) && parsed.length > 0) setRecentlyViewed(parsed);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray(".featureCardGsap").forEach((card, i) => {
      gsap.fromTo(card, { opacity: 0, y: 28 }, {
        opacity: 1, y: 0, duration: 0.75, delay: i * 0.12, ease: "power3.out",
        scrollTrigger: { trigger: card, start: "top 90%" },
      });
    });
  }, []);

  const bgImages = ["/images/product1.jpg", "/images/product4.jpg", "/images/product2.jpg", "/images/product3.jpg"];

  const features = [
    { Icon: ShoppingBag, title: "Live Commerce Experience", desc: "Watch your favorite sellers go live, explore real-time demos, interact directly, and purchase instantly — all in one seamless experience." },
    { Icon: Bot,         title: "AI Order Assistance",      desc: "Our AI understands your preferences, recommends the best products, manages your orders, and predicts your next favourite buy." },
    { Icon: Globe2,      title: "Augmented Reality Try-On", desc: "Virtually try furniture, clothing, or accessories in your space using your camera — ensuring perfect fits and confident purchases." },
    { Icon: Sparkles,    title: "Shop Latest Trends",       desc: "Explore trending collections globally in real time. Discover curated picks, influencer favourites, and new arrivals tailored to your taste." },
  ];

  const fashionImages = [
    { src: "/images/img1.jpg", hMd: 180, hXs: 130 },
    { src: "/images/img7.jpg", hMd: 250, hXs: 170 },
    { src: "/images/img3.jpg", hMd: 300, hXs: 200 },
   
    { src: "/images/img6.jpg", hMd: 300, hXs: 200 },
    { src: "/images/img5.jpg", hMd: 250, hXs: 170 },
    { src: "/images/img4.jpg", hMd: 180, hXs: 130 },
  ];

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: C.white, color: C.navy }}>

      {/* ══ HERO ══════════════════════════════════════════════════════════════ */}
      <Box component="section" sx={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden" }}>
        <Box sx={{ position: "absolute", inset: 0 }}>
          <Slide image="/images/hero1.jpg" delay={0} />
          <Slide image="/images/hero2.jpg" delay={4} />
          <Slide image="/images/hero3.jpg" delay={8} />
        </Box>
        <Box sx={{
          position: "absolute", inset: 0, zIndex: 2,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", px: 2, textAlign: "center",
        }}>
          <Typography sx={{ fontSize: { xs: "0.65rem", md: "0.75rem" }, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", mb: 1.5 }}>
            Welcome to the future of shopping
          </Typography>
          <Typography variant="h1" sx={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: { xs: "2.2rem", sm: "3rem", md: "4.5rem" }, color: C.white, lineHeight: 1.1, mb: 2.5, textShadow: "0 4px 32px rgba(0,0,0,0.35)" }}>
            SHOPSPHERE
          </Typography>
          <Typography sx={{ fontSize: { xs: "1rem", md: "1.2rem" }, color: "rgba(255,255,255,0.82)", mb: 4.5, maxWidth: 460 }}>
            Discover the best stores &amp; exclusive collections
          </Typography>
          <PrimaryBtn component={Link} href="#stores">Explore Stores</PrimaryBtn>
        </Box>
      </Box>

      {/* ══ STORES ════════════════════════════════════════════════════════════ */}
      <Box component="section" id="stores" sx={{ width: "100%", bgcolor: C.white, ...sxPad }}>
        <Box sx={sxInner}>
          <Box sx={sxHeading}>
            <Eyebrow>Our Stores</Eyebrow>
            <Typography variant="h2" sx={{ fontSize: { xs: "1.9rem", md: "2.5rem" }, fontWeight: 800, color: C.navy, mt: 0.5 }}>
              Shop by Store
            </Typography>
            <Typography sx={{ color: C.muted, mt: 1, fontSize: "0.98rem" }}>
              Handpicked stores with the finest selections
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: C.blue }} />
            </Box>
          ) : error ? (
            <Typography color="error" textAlign="center">{error}</Typography>
          ) : stores.length === 0 ? (
            <Typography textAlign="center" sx={{ color: C.muted }}>No stores found.</Typography>
          ) : (
            <>
              <Grid container spacing={4} alignItems="stretch" justifyContent="center">
                {stores.slice(0, 4).map((store, index) => (
                  <Grid item key={store._id} sx={{ width: 280, height: 340, display: "flex" }}>
                    <StoreCard href={`/user/stores/${store._id}`} bgimage={bgImages[index]}>
                      <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(0deg,rgba(8,17,46,0.82) 0%,rgba(8,17,46,0.04) 60%)" }} />
                      <Box sx={{ position: "relative", zIndex: 1 }}>
                        <Typography sx={{ fontSize: { xs: "1.25rem", md: "1.5rem" }, fontWeight: 800, color: C.white, mb: 0.75, lineHeight: 1.2 }}>
                          {store.name}
                        </Typography>
                        {Array.isArray(store.categories) && store.categories.length > 0 && (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {store.categories.map((cat, i) => (
                              <Chip key={i} label={cat} size="small" sx={{ bgcolor: "rgba(255,255,255,0.15)", color: C.white, fontSize: "0.76rem", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.22)" }} />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </StoreCard>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                <PrimaryBtn component={Link} href="/user/allStores">Explore All Stores</PrimaryBtn>
              </Box>
            </>
          )}
        </Box>
      </Box>

      <Divider sx={{ width: "100%", maxWidth: 1200, mx: "auto", borderColor: C.border }} />

      {/* ══ RECOMMENDATIONS ══════════════════════════════════════════════════ */}
      {token && (
        <Box component="section" sx={{ width: "100%", bgcolor: C.white, ...sxPad }}>
          <Box sx={sxInner}>
            <Box sx={sxHeading}>
              <Eyebrow>Personalized</Eyebrow>
              <Typography variant="h2" sx={{ fontSize: { xs: "1.9rem", md: "2.5rem" }, fontWeight: 800, color: C.navy, mt: 0.5 }}>
                Recommended For You
              </Typography>
            </Box>
            <Recommendations token={token} variant="slider" />
          </Box>
        </Box>
      )}

      {/* ══ WHY CHOOSE ═══════════════════════════════════════════════════════ */}
      <Box component="section" sx={{ width: "100%", bgcolor: C.sectionAlt, ...sxPad }}>
        <Box sx={sxInner}>
          <Box sx={sxHeading}>
            <Eyebrow>Why Us</Eyebrow>
            <Typography variant="h2" sx={{ fontSize: { xs: "1.9rem", md: "2.5rem" }, fontWeight: 800, color: C.navy, mt: 0.5 }}>
              Why Choose ShopSphere?
            </Typography>
            <Typography sx={{ color: C.muted, mt: 1, maxWidth: 460, mx: "auto", fontSize: "0.98rem" }}>
              Built for the next generation of shoppers
            </Typography>
          </Box>

          <Box sx={{ overflowX: "auto", pb: 2 }}>
            <Grid container spacing={3} wrap="nowrap" justifyContent="center">
              {features.map(({ Icon, title, desc }, i) => (
                <Grid item key={title} sx={{ minWidth: 280, maxWidth: 280, display: "flex" }}>
                  <FeatureCard
                    className="featureCardGsap"
                    sx={{ aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <ParticleMesh />
                    <Box sx={{ position: "relative", zIndex: 1, textAlign: "center", px: 2 }}>
                      <Box sx={{ width: 56, height: 56, borderRadius: "14px", background: "rgba(110,130,184,0.12)", border: "1px solid rgba(110,130,184,0.22)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                        <Icon style={{ width: 26, height: 26, color: C.blueVeryLight, strokeWidth: 1.8 }} />
                      </Box>
                      <Typography sx={{ fontSize: "1.15rem", fontWeight: 800, color: C.white, mb: 1 }}>{title}</Typography>
                      <Typography sx={{ fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>{desc}</Typography>
                    </Box>
                  </FeatureCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>

     {/* ══ FASHION ══════════════════════════════════════════════════════════ */}
<Box component="section" sx={{ width: "100%", bgcolor: C.white, ...sxPad }}>
  <Box sx={sxInner}>
    <Box sx={sxHeading}>
      <Eyebrow>Collections</Eyebrow>
      <Typography
        variant="h2"
        sx={{ fontSize: { xs: "1.8rem", md: "2.7rem" }, fontWeight: 700, color: C.navy, lineHeight: 1.15, mt: 0.5 }}
      >
        Elevate Your Style With
      </Typography>
      <Typography
        variant="h2"
        sx={{
          fontSize: { xs: "2rem", md: "3rem" },
          fontWeight: 900,
          background: `linear-gradient(90deg,${C.blue},${C.blueLight})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          lineHeight: 1.2,
        }}
      >
        Bold Fashion
      </Typography>
    </Box>

    {/* Grid: 3 images left, button center, 3 images right */}
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "repeat(7, 1fr)" },
        gap: { xs: "0.5rem", md: "0.9rem" },
        alignItems: "center",
        justifyItems: "center",
        mt: 4,
      }}
    >
      {fashionImages.slice(0, 3).map((item, i) => (
        <Box
          key={i}
          component="img"
          src={item.src}
          alt={`Fashion ${i + 1}`}
          sx={{
            borderRadius: "1.2rem",
            width: "100%",
            height: { xs: item.hXs, md: item.hMd },
            objectFit: "cover",
            transition: "transform 0.4s ease",
            "&:hover": { transform: "scale(1.04)" },
          }}
        />
      ))}

      {/* Center button, slightly smaller single-line */}
      <PrimaryBtn
        component={Link}
        href="/user/products"
        sx={{
          px: "1.5rem",    // smaller horizontal padding
          py: 1,           // smaller vertical padding
          fontSize: "0.85rem", // smaller font
          whiteSpace: "nowrap" // force single-line text
        }}
      >
        Explore Products
      </PrimaryBtn>

      {fashionImages.slice(3, 6).map((item, i) => (
        <Box
          key={i + 3}
          component="img"
          src={item.src}
          alt={`Fashion ${i + 4}`}
          sx={{
            borderRadius: "1.2rem",
            width: "100%",
            height: { xs: item.hXs, md: item.hMd },
            objectFit: "cover",
            transition: "transform 0.4s ease",
            "&:hover": { transform: "scale(1.04)" },
          }}
        />
      ))}
    </Box>
  </Box>
</Box>

      {/* ══ RECENTLY VIEWED ══════════════════════════════════════════════════ */}
      {recentlyViewed.length > 0 && (
        <Box component="section" sx={{ width: "100%", bgcolor: C.sectionAlt, ...sxPad }}>
          <Box sx={sxInner}>
            <Box sx={sxHeading}>
              <Eyebrow>History</Eyebrow>
              <Typography variant="h2" sx={{ fontSize: { xs: "1.9rem", md: "2.5rem" }, fontWeight: 800, color: C.navy, mt: 0.5 }}>
                Recently Viewed
              </Typography>
            </Box>
            <Box sx={{ overflowX: "auto", pb: 2 }}>
              <Grid container spacing={3} wrap="nowrap" alignItems="stretch">
                {recentlyViewed.map((product, index) => {
                  const canonicalId = product.id ?? product.productId ?? product._id ?? String(index);
                  return (
                    <Grid item key={canonicalId} sx={{ minWidth: 280, maxWidth: 280, display: "flex" }}>
                      <ProductCardWrapper sx={{ flex: 1 }}>
                        <ProductCard product={{ ...product, id: canonicalId, _id: canonicalId }} />
                      </ProductCardWrapper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Box>
        </Box>
      )}

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <Box component="footer" sx={{ width: "100%", background: "linear-gradient(150deg,#070f28 0%,#0e1c44 100%)", color: C.white, pt: { xs: "3.5rem", md: "5rem" }, pb: { xs: "2rem", md: "2.5rem" }, px: { xs: "1.5rem", md: "2.5rem" } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "3rem", width: "100%", maxWidth: 1400, mx: "auto" }}>
          <Box sx={{ flex: 1.5, minWidth: 230 }}>
            <Typography sx={{ fontFamily: "'Orbitron', sans-serif", fontSize: "1.35rem", fontWeight: 800, mb: 1.5, letterSpacing: "0.07em", color: C.white }}>
              SHOPSPHERE
            </Typography>
            <Typography sx={{ fontSize: "0.88rem", lineHeight: 1.75, color: "rgba(255,255,255,0.48)", maxWidth: 270 }}>
              Redefining shopping through innovation — AI, AR, and Live Commerce.
            </Typography>
          </Box>

          <Box sx={{ flex: 1, minWidth: 155 }}>
            <Typography sx={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: C.blueVeryLight, mb: 2, fontWeight: 700 }}>
              Quick Links
            </Typography>
            {[
              { label: "About Us",           href: "/footer/quickLinks/about" },
              { label: "Contact",            href: "/footer/quickLinks/contact" },
              { label: "Privacy Policy",     href: "/footer/quickLinks/privacy" },
              { label: "Terms & Conditions", href: "/footer/quickLinks/terms" },
            ].map(({ label, href }) => (
              <Box key={label} component={Link} href={href} sx={{ display: "block", color: "rgba(255,255,255,0.48)", mb: "0.55rem", fontSize: "0.88rem", textDecoration: "none", transition: "color 0.2s", "&:hover": { color: C.white } }}>
                {label}
              </Box>
            ))}
          </Box>

          <Box sx={{ flex: 1, minWidth: 155 }}>
            <Typography sx={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: C.blueVeryLight, mb: 2, fontWeight: 700 }}>
              Follow Us
            </Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {[FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn].map((Icon, i) => (
                <SocialBtn key={i} component={Link} href="#" size="small">
                  <Icon size={13} />
                </SocialBtn>
              ))}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.07)", my: { xs: 3, md: 4 }, maxWidth: 1400, mx: "auto" }} />
        <Typography sx={{ textAlign: "center", fontSize: "0.82rem", color: "rgba(255,255,255,0.3)" }}>
          &copy; {new Date().getFullYear()} <strong style={{ color: "rgba(255,255,255,0.55)" }}>ShopSphere</strong>. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute role="user">
      <HomeContent />
    </ProtectedRoute>
  );
}
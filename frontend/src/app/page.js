"use client";
import ProtectedRoute from "../../components/ProtectedRoute";
import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ShoppingBag, Bot, Globe2, Sparkles, ChevronDown } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import ProductCard from "../../components/ProductCard";
import { auth } from "../../firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import Recommendations from "../../components/Recommendations";
import ChatbotWrapper from "../../components/ChatbotWrapper";

import {
  Box, Typography, Grid, Chip, Button, IconButton, Divider, CircularProgress,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  ink:          "#1a2238",
  body:         "#3d4f6e",
  muted:        "#6b7c99",
  subtle:       "#9baabb",

  surface0:     "#ffffff",
  surface1:     "#f4f6fb",
  surface2:     "#eaeff8",

  dark:         "#0d1629",
  darkCard:     "#121e38",

  accent:       "#2251d4",
  accentHov:    "#1a3fa8",
  accentSoft:   "#dce6fb",
  accentOnSoft: "#1a3fa8",

  onDark:       "#ffffff",
  onDarkDim:    "rgba(255,255,255,0.60)",
  onDarkFaint:  "rgba(255,255,255,0.28)",

  glowBlue:     "rgba(160,185,255,0.88)",
  glowBlueSoft: "rgba(160,185,255,0.12)",

  borderLight:  "#dde4f0",
  borderDark:   "rgba(255,255,255,0.07)",

  heroLeft:     "rgba(13,22,41,0.84)",
  heroRight:    "rgba(13,22,41,0.00)",
  heroBottom:   "rgba(13,22,41,0.80)",
};

// ─── Keyframes ────────────────────────────────────────────────────────────────
const revealUp = keyframes`
  from { opacity: 0; transform: translateY(32px) skewY(1.5deg); }
  to   { opacity: 1; transform: translateY(0)    skewY(0deg);   }
`;
const revealFade = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;
const scrollBounce = keyframes`
  0%,100% { transform: translateY(0);  opacity: 0.45; }
  50%     { transform: translateY(8px); opacity: 1;   }
`;
const barGrow = keyframes`
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
`;
const pulse = keyframes`
  0%,100% { opacity: 1; }
  50%     { opacity: 0.4; }
`;

// ─── Hero Constants ───────────────────────────────────────────────────────────
const SLIDE_DURATION = 5000;
const SLIDES = [
  { src: "/images/hero1.jpg", label: "New Arrivals"    },
  { src: "/images/hero2.jpg", label: "Trending Now"    },
  { src: "/images/hero3.jpg", label: "Exclusive Drops" },
];

// ─── Fallback stats (shown while loading) ─────────────────────────────────────
const FALLBACK_STATS = [
  { value: "—",   label: "Active Shoppers" },
  { value: "—",   label: "Curated Stores"  },

];

// ─── Layout Helpers ───────────────────────────────────────────────────────────
const sxPad     = { px: { xs: 2, sm: 3, md: 5 }, py: { xs: 7, md: 10 } };
const sxInner   = { width: "100%", maxWidth: 1400, mx: "auto" };
const sxHeading = { textAlign: "center", mb: 6 };

// ─── Styled Components ────────────────────────────────────────────────────────
const Eyebrow = styled(Typography)({
  display:         "inline-block",
  fontSize:        "0.68rem",
  fontWeight:      700,
  letterSpacing:   "0.22em",
  textTransform:   "uppercase",
  color:           T.accentOnSoft,
  backgroundColor: T.accentSoft,
  borderRadius:    30,
  padding:         "4px 14px",
  marginBottom:    "0.6rem",
});

const EyebrowDark = styled(Typography)({
  display:         "inline-block",
  fontSize:        "0.68rem",
  fontWeight:      700,
  letterSpacing:   "0.22em",
  textTransform:   "uppercase",
  color:           T.glowBlue,
  backgroundColor: T.glowBlueSoft,
  borderRadius:    30,
  padding:         "4px 14px",
  marginBottom:    "0.6rem",
});

const PageDivider = styled(Divider)({
  width: "100%", maxWidth: 1200, margin: "0 auto",
  borderColor: T.borderLight,
});

const PrimaryBtn = styled(Button)({
  background:    T.accent,
  color:         T.onDark,
  borderRadius:  40,
  fontWeight:    700,
  textTransform: "none",
  fontSize:      "0.93rem",
  padding:       "0.7rem 2rem",
  boxShadow:     "none",
  transition:    "all 0.25s ease",
  "&:hover": {
    background: T.accentHov,
    boxShadow:  `0 6px 22px ${T.accent}44`,
    transform:  "translateY(-2px)",
  },
});

const HeroPrimaryBtn = styled(Link)({
  display:        "inline-flex",
  alignItems:     "center",
  background:     "transparent",
  color:          T.onDark,
  border:         "1.5px solid rgba(255,255,255,0.55)",
  borderRadius:   3,
  fontWeight:     700,
  fontSize:       "0.82rem",
  letterSpacing:  "0.16em",
  textTransform:  "uppercase",
  padding:        "0.85rem 2.2rem",
  textDecoration: "none",
  backdropFilter: "blur(6px)",
  transition:     "all 0.3s ease",
  "&:hover": { background: "rgba(255,255,255,0.13)", borderColor: T.onDark, transform: "translateY(-2px)" },
});

const GhostBtn = styled(Link)({
  display:        "inline-flex",
  alignItems:     "center",
  color:          T.onDarkDim,
  fontSize:       "0.8rem",
  letterSpacing:  "0.12em",
  textTransform:  "uppercase",
  textDecoration: "none",
  fontWeight:     600,
  transition:     "color 0.25s ease",
  "&:hover": { color: T.onDark },
  "&::after": {
    content: '""', display: "block", width: "100%",
    height: "1px", background: "rgba(255,255,255,0.28)", marginTop: "2px",
  },
});

const StoreCard = styled(Link)(({ bgimage }) => ({
  position:           "relative",
  display:            "flex",
  flexDirection:      "column",
  justifyContent:     "flex-end",
  width:              "100%",
  height:             "100%",
  borderRadius:       20,
  padding:            "1.5rem",
  backgroundSize:     "cover",
  backgroundPosition: "center",
  backgroundImage:    `url('${bgimage}')`,
  textDecoration:     "none",
  overflow:           "hidden",
  border:             `1px solid ${T.borderLight}`,
  boxShadow:          "0 2px 12px rgba(34,81,212,0.07)",
  transition:         "transform 0.35s ease, box-shadow 0.35s ease",
  "&:hover": { transform: "translateY(-6px) scale(1.01)", boxShadow: "0 14px 36px rgba(34,81,212,0.18)" },
}));

const FeatureCard = styled(Box)({
  background:   `linear-gradient(140deg, ${T.darkCard} 0%, #1a3168 100%)`,
  position:     "relative",
  overflow:     "hidden",
  padding:      "2rem 1.8rem",
  borderRadius: 20,
  border:       `1px solid ${T.borderDark}`,
  boxShadow:    "0 6px 28px rgba(13,22,41,0.24)",
  transition:   "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": { transform: "translateY(-7px)", boxShadow: "0 16px 44px rgba(13,22,41,0.38)" },
});

const SocialBtn = styled(IconButton)({
  background: "rgba(255,255,255,0.07)",
  color:      T.onDark,
  width: 38, height: 38,
  border:     `1px solid ${T.borderDark}`,
  transition: "all 0.28s ease",
  "&:hover": { background: T.onDark, color: T.dark, transform: "translateY(-4px)" },
});

const ProductCardWrapper = styled(Box)({
  width:           "100%",
  display:         "flex",
  flexDirection:   "column",
  borderRadius:    16,
  overflow:        "hidden",
  border:          `1px solid ${T.borderLight}`,
  backgroundColor: T.surface0,
  boxShadow:       "0 2px 10px rgba(34,81,212,0.05)",
  transition:      "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": { transform: "translateY(-5px)", boxShadow: "0 10px 28px rgba(34,81,212,0.12)" },
  "& > *": { width: "100% !important", maxWidth: "none !important" },
});

// ─── Utility: format large numbers ───────────────────────────────────────────
function formatStat(value) {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return String(value);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M+`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K+`;
  return `${num}+`;
}

function formatPct(value) {
  if (value === null || value === undefined) return "—";
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return `${Math.round(num)}%`;
}

// ─── ParticleCanvas ───────────────────────────────────────────────────────────
function ParticleCanvas({ mouseRef }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    const pts = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.8,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current?.x ?? -999;
      const my = mouseRef.current?.y ?? -999;

      for (let i = 0; i < pts.length; i++) {
        const dx = pts[i].x - mx, dy = pts[i].y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) { pts[i].vx += (dx / dist) * 0.12; pts[i].vy += (dy / dist) * 0.12; }
        const speed = Math.sqrt(pts[i].vx ** 2 + pts[i].vy ** 2);
        if (speed > 1.2) { pts[i].vx *= 0.97; pts[i].vy *= 0.97; }
        pts[i].x += pts[i].vx; pts[i].y += pts[i].vy;
        if (pts[i].x < 0 || pts[i].x > canvas.width)  pts[i].vx *= -1;
        if (pts[i].y < 0 || pts[i].y > canvas.height) pts[i].vy *= -1;

        for (let j = i + 1; j < pts.length; j++) {
          const ex = pts[i].x - pts[j].x, ey = pts[i].y - pts[j].y;
          const d = Math.sqrt(ex * ex + ey * ey);
          if (d < 110) {
            ctx.strokeStyle = `rgba(160,185,255,${(1 - d / 110) * 0.38})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
        ctx.fillStyle = "rgba(160,185,255,0.52)";
        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, pts[i].size, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(raf); };
  }, [mouseRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none", opacity: 0.6 }}
    />
  );
}

// ─── ParticleMesh ─────────────────────────────────────────────────────────────
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
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.strokeStyle = `rgba(130,160,255,${(1 - d / 100) * 0.42})`;
            ctx.lineWidth = 0.65;
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
          }
        }
        pts[i].x += pts[i].vx; pts[i].y += pts[i].vy;
        if (pts[i].x < 0 || pts[i].x > canvas.width)  pts[i].vx *= -1;
        if (pts[i].y < 0 || pts[i].y > canvas.height) pts[i].vy *= -1;
        ctx.fillStyle = "rgba(130,160,255,0.48)";
        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 1.7, 0, Math.PI * 2); ctx.fill();
      }
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

// ─── Slide Progress Bar ───────────────────────────────────────────────────────
function SlideProgressBar({ active, index, onClick }) {
  return (
    <Box
      onClick={() => onClick(index)}
      sx={{
        display: "flex", flexDirection: "column", gap: "6px",
        cursor: "pointer", opacity: active ? 1 : 0.38,
        transition: "opacity 0.3s", "&:hover": { opacity: 1 },
      }}
    >
      <Typography sx={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: T.onDark, fontWeight: 700 }}>
        {SLIDES[index].label}
      </Typography>
      <Box sx={{ width: 68, height: "1.5px", bgcolor: "rgba(255,255,255,0.18)", borderRadius: 1, overflow: "hidden" }}>
        {active && (
          <Box sx={{ height: "100%", bgcolor: T.onDark, transformOrigin: "left", animation: `${barGrow} ${SLIDE_DURATION}ms linear forwards` }} />
        )}
      </Box>
    </Box>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection({ stats, statsLoading }) {
  const [slide, setSlide]                 = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const mouseRef = useRef({ x: -999, y: -999 });
  const heroRef  = useRef(null);

  const goTo = useCallback((idx) => {
    if (idx === slide || transitioning) return;
    setTransitioning(true);
    setSlide(idx);
    setTimeout(() => setTransitioning(false), 900);
  }, [slide, transitioning]);

  useEffect(() => {
    const timer = setInterval(() => setSlide(prev => (prev + 1) % SLIDES.length), SLIDE_DURATION);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const onMove  = (e) => { const r = hero.getBoundingClientRect(); mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const onLeave = () => { mouseRef.current = { x: -999, y: -999 }; };
    hero.addEventListener("mousemove", onMove);
    hero.addEventListener("mouseleave", onLeave);
    return () => { hero.removeEventListener("mousemove", onMove); hero.removeEventListener("mouseleave", onLeave); };
  }, []);

  const displayStats = statsLoading ? FALLBACK_STATS : stats;

  return (
    <Box
      ref={heroRef}
      component="section"
      sx={{ position: "relative", width: "100%", height: "100vh", minHeight: 600, overflow: "hidden", bgcolor: T.dark }}
    >
      {/* Background slides */}
      {SLIDES.map((s, i) => (
        <Box key={i} sx={{
          position: "absolute", inset: 0,
          backgroundImage: `url('${s.src}')`, backgroundSize: "cover", backgroundPosition: "center",
          zIndex: 0,
          opacity: i === slide ? 1 : 0,
          transform: i === slide ? "scale(1.03)" : "scale(1)",
          transition: "opacity 0.9s cubic-bezier(0.4,0,0.2,1), transform 6s ease-out",
        }} />
      ))}

      {/* Gradient overlays */}
      <Box sx={{ position: "absolute", inset: 0, zIndex: 1, background: `linear-gradient(105deg, ${T.heroLeft} 0%, rgba(13,22,41,0.50) 52%, ${T.heroRight} 100%)` }} />
      <Box sx={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "38%", zIndex: 1, background: `linear-gradient(0deg, ${T.heroBottom} 0%, transparent 100%)` }} />

      {/* Particles */}
      <ParticleCanvas mouseRef={mouseRef} />

      {/* Content grid */}
      <Box sx={{
        position: "absolute", inset: 0, zIndex: 3,
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
        gridTemplateRows: "1fr auto",
        alignItems: "center",
        px: { xs: 3, sm: 5, md: 8, lg: 10 },
        pt: { xs: 10, md: 0 },
      }}>

        {/* Left: main copy */}
        <Box sx={{ gridColumn: 1, gridRow: 1, maxWidth: { xs: "100%", md: 620 } }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: "8px", mb: 3, animation: `${revealFade} 0.8s 0.1s ease both` }}>
            <Box sx={{ width: 28, height: "1.5px", bgcolor: T.glowBlue }} />
            <Typography sx={{ fontSize: "0.63rem", letterSpacing: "0.3em", textTransform: "uppercase", color: T.glowBlue, fontWeight: 700 }}>
              Welcome to ShopSphere
            </Typography>
          </Box>

          <Box sx={{ overflow: "hidden", mb: 0.5 }}>
            <Typography component="h1" sx={{
              fontFamily: "'Orbitron', sans-serif", fontWeight: 900,
              fontSize: { xs: "2.8rem", sm: "3.8rem", md: "5rem", lg: "5.8rem" },
              lineHeight: 0.95, color: T.onDark, letterSpacing: "-0.02em",
              animation: `${revealUp} 0.75s 0.25s cubic-bezier(0.16,1,0.3,1) both`,
            }}>
              SHOP
            </Typography>
          </Box>
          <Box sx={{ overflow: "hidden", mb: 2.5 }}>
            <Typography component="h1" sx={{
              fontFamily: "'Orbitron', sans-serif", fontWeight: 900,
              fontSize: { xs: "2.8rem", sm: "3.8rem", md: "5rem", lg: "5.8rem" },
              lineHeight: 0.95,
              WebkitTextStroke: "1.5px rgba(255,255,255,0.5)",
              color: "transparent", letterSpacing: "-0.02em",
              animation: `${revealUp} 0.75s 0.4s cubic-bezier(0.16,1,0.3,1) both`,
            }}>
              SPHERE
            </Typography>
          </Box>

          <Typography sx={{
            fontSize: { xs: "0.95rem", md: "1.05rem" },
            color: T.onDarkDim, lineHeight: 1.75, maxWidth: 400, mb: 4.5,
            animation: `${revealFade} 0.9s 0.65s ease both`,
          }}>
            Discover exclusive collections, AI-powered recommendations, and live commerce — all in one place.
          </Typography>

          <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap", alignItems: "center", animation: `${revealFade} 0.9s 0.85s ease both` }}>
            <HeroPrimaryBtn href="#stores">Explore Stores</HeroPrimaryBtn>
            <GhostBtn href="/user/products">View All Products →</GhostBtn>
          </Box>
        </Box>

        {/* Right: live stats */}
        <Box sx={{
          gridColumn: { xs: 1, md: 2 }, gridRow: { xs: 2, md: 1 },
          display: "flex", flexDirection: { xs: "row", md: "column" },
          gap: { xs: 3, md: 2.5 }, mb: { xs: 3, md: 0 }, mt: { xs: 4, md: 0 },
          alignSelf: { xs: "flex-end", md: "center" },
          animation: `${revealFade} 1.1s 1s ease both`,
        }}>
          {displayStats.map((stat) => (
            <Box key={stat.label} sx={{
              textAlign: { xs: "left", md: "right" },
              borderRight: { xs: "none", md: `1px solid ${T.borderDark}` },
              pr: { xs: 0, md: 3.5 },
            }}>
              <Typography sx={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: { xs: "1.4rem", md: "1.9rem" },
                fontWeight: 800,
                color: T.onDark,
                lineHeight: 1,
                mb: 0.4,
                // subtle pulse while loading
                animation: statsLoading ? `${pulse} 1.4s ease-in-out infinite` : "none",
              }}>
                {stat.value}
              </Typography>
              <Typography sx={{ fontSize: "0.66rem", letterSpacing: "0.16em", textTransform: "uppercase", color: T.onDarkDim, fontWeight: 600 }}>
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Bottom bar: slide controls + scroll indicator */}
        <Box sx={{
          gridColumn: "1 / -1", gridRow: { xs: 3, md: 2 },
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          pb: { xs: 3.5, md: 4.5 },
          animation: `${revealFade} 1s 1.1s ease both`,
        }}>
          <Box sx={{ display: "flex", gap: 3, alignItems: "center" }}>
            {SLIDES.map((_, i) => (
              <SlideProgressBar key={i} index={i} active={i === slide} onClick={goTo} />
            ))}
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <Typography sx={{ fontSize: "0.58rem", letterSpacing: "0.22em", textTransform: "uppercase", color: T.onDarkFaint, fontWeight: 700, writingMode: "vertical-rl" }}>
              Scroll
            </Typography>
            <Box sx={{ animation: `${scrollBounce} 2s ease-in-out infinite` }}>
              <ChevronDown size={15} color={T.onDarkFaint} />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function HomeContent() {
  const [stores, setStores]                 = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [token, setToken]                   = useState(null);

  // ── Analytics stats ────────────────────────────────────────────────────────
  const [stats, setStats]               = useState(FALLBACK_STATS);
  const [statsLoading, setStatsLoading] = useState(true);

  // Resolve Firebase token, then fetch analytics with it as a Bearer header.
  // Both concerns live here so we never fire the request before auth resolves.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      // Always update the shared token state for other sections
      if (user) {
        const idToken = await user.getIdToken();
        setToken(idToken);
        await fetchAnalytics(idToken);
      } else {
        // Not signed in — still try without a token (will 401 and fall back gracefully)
        await fetchAnalytics(null);
      }
    });
    return () => unsub();

    async function fetchAnalytics(idToken) {
      try {
        const headers = { "Content-Type": "application/json" };
        if (idToken) {
          // Cover both common patterns — backend may read either one
          headers["Authorization"] = `Bearer ${idToken}`;
          headers["x-auth-token"]  = idToken;
        }

        const res = await fetch("http://localhost:4000/api/dashboard/analytics", );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        /*
         * Map API response → hero stats.
         * Handles camelCase, snake_case, and a nested `data` wrapper.
         */
        const d = data?.data ?? data;

        const totalUsers   = d?.totalUsers  ;
        const totalStores  = d?.activeStores ;
        

        setStats([
          { value: totalUsers   !== null ? formatStat(totalUsers)  : "—", label: "Active Shoppers" },
          { value: totalStores  !== null ? formatStat(totalStores) : "—", label: "Curated Stores"  },
        ]);
      } catch (err) {
        console.error("Analytics fetch failed:", err);
        setStats(FALLBACK_STATS);
      } finally {
        setStatsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchStores() {
      try {
        const res  = await fetch(`${BASE_URL}/api/stores`);
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
    { Icon: ShoppingBag, title: "Live Commerce",  desc: "Watch sellers go live, demo products in real-time, interact directly, and purchase instantly — all in one seamless experience." },
    { Icon: Bot,         title: "AI Assistance",  desc: "Our AI understands your preferences, recommends products, manages your orders, and predicts your next favourite buy." },
    { Icon: Globe2,      title: "AR Try-On",      desc: "Virtually try furniture, clothing, or accessories in your own space using your camera before you commit to a purchase." },
    { Icon: Sparkles,    title: "Latest Trends",  desc: "Explore trending collections globally in real time — curated picks, influencer favourites, and new arrivals tailored to you." },
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
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: T.surface0, color: T.body }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <HeroSection stats={stats} statsLoading={statsLoading} />

      {/* ── Stores  [surface0 — white] ───────────────────────────────────── */}
      <Box component="section" id="stores" sx={{ width: "100%", bgcolor: T.surface0, ...sxPad }}>
        <Box sx={sxInner}>
          <Box sx={sxHeading}>
            <Eyebrow>Our Stores</Eyebrow>
            <Typography variant="h2" sx={{ fontSize: { xs: "1.9rem", md: "2.5rem" }, fontWeight: 800, color: T.ink, mt: 0.5 }}>
              Shop by Store
            </Typography>
            <Typography sx={{ color: T.muted, mt: 1, fontSize: "0.97rem" }}>
              Handpicked stores with the finest selections
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: T.accent }} />
            </Box>
          ) : error ? (
            <Typography color="error" textAlign="center">{error}</Typography>
          ) : stores.length === 0 ? (
            <Typography textAlign="center" sx={{ color: T.muted }}>No stores found.</Typography>
          ) : (
            <>
              <Grid container spacing={4} alignItems="stretch" justifyContent="center">
                {stores.slice(0, 4).map((store, index) => (
                  <Grid item key={store._id} sx={{ width: 280, height: 340, display: "flex" }}>
                    <StoreCard href={`/user/stores/${store._id}`} bgimage={bgImages[index]}>
                      <Box sx={{ position: "absolute", inset: 0, background: `linear-gradient(0deg, ${T.heroLeft} 0%, rgba(13,22,41,0.04) 65%)` }} />
                      <Box sx={{ position: "relative", zIndex: 1 }}>
                        <Typography sx={{ fontSize: { xs: "1.2rem", md: "1.45rem" }, fontWeight: 800, color: T.onDark, mb: 0.75, lineHeight: 1.2 }}>
                          {store.name}
                        </Typography>
                        {Array.isArray(store.categories) && store.categories.length > 0 && (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {store.categories.map((cat, i) => (
                              <Chip key={i} label={cat} size="small" sx={{
                                bgcolor: "rgba(255,255,255,0.14)", color: T.onDark,
                                fontSize: "0.73rem", borderRadius: "20px",
                                border: "1px solid rgba(255,255,255,0.22)",
                              }} />
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

      <PageDivider />

      {/* ── Recommendations  [surface1 — tinted] ────────────────────────── */}
      {token && (
        <Box component="section" sx={{ width: "100%", bgcolor: T.surface1, ...sxPad }}>
          <Box sx={sxInner}>
            <Box sx={sxHeading}>
              <Eyebrow>Personalized</Eyebrow>
              <Typography variant="h2" sx={{ fontSize: { xs: "1.9rem", md: "2.5rem" }, fontWeight: 800, color: T.ink, mt: 0.5 }}>
                Recommended For You
              </Typography>
            </Box>
            <Recommendations token={token} variant="slider" />
          </Box>
        </Box>
      )}

      <PageDivider />

      {/* ── Why Choose  [dark] ───────────────────────────────────────────── */}
      <Box component="section" sx={{ width: "100%", bgcolor: T.dark, ...sxPad }}>
        <Box sx={sxInner}>
          <Box sx={sxHeading}>
            <EyebrowDark>Why Us</EyebrowDark>
            <Typography variant="h2" sx={{ fontSize: { xs: "1.9rem", md: "2.5rem" }, fontWeight: 800, color: T.onDark, mt: 0.5 }}>
              Why Choose ShopSphere?
            </Typography>
            <Typography sx={{ color: T.onDarkDim, mt: 1, maxWidth: 460, mx: "auto", fontSize: "0.97rem" }}>
              Built for the next generation of shoppers
            </Typography>
          </Box>

          <Box sx={{ overflowX: "auto", pb: 2 }}>
            <Grid container spacing={3} wrap="nowrap" justifyContent="center">
              {features.map(({ Icon, title, desc }) => (
                <Grid item key={title} sx={{ minWidth: 280, maxWidth: 280, display: "flex" }}>
                  <FeatureCard
                    className="featureCardGsap"
                    sx={{ aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >
                    <ParticleMesh />
                    <Box sx={{ position: "relative", zIndex: 1, textAlign: "center", px: 2 }}>
                      <Box sx={{
                        width: 56, height: 56, borderRadius: "14px",
                        background: T.glowBlueSoft,
                        border: `1px solid rgba(160,185,255,0.2)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        mx: "auto", mb: 2,
                      }}>
                        <Icon style={{ width: 26, height: 26, color: T.glowBlue, strokeWidth: 1.7 }} />
                      </Box>
                      <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, color: T.onDark, mb: 1 }}>{title}</Typography>
                      <Typography sx={{ fontSize: "0.88rem", lineHeight: 1.65, color: T.onDarkDim }}>{desc}</Typography>
                    </Box>
                  </FeatureCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* ── Fashion Collections  [surface0 — white] ──────────────────────── */}
      <Box component="section" sx={{ width: "100%", bgcolor: T.surface0, ...sxPad }}>
        <Box sx={sxInner}>
          <Box sx={sxHeading}>
            <Eyebrow>Collections</Eyebrow>
            <Typography variant="h2" sx={{ fontSize: { xs: "1.8rem", md: "2.6rem" }, fontWeight: 700, color: T.ink, lineHeight: 1.15, mt: 0.5 }}>
              Elevate Your Style With
            </Typography>
            <Typography variant="h2" sx={{
              fontSize: { xs: "2rem", md: "3rem" }, fontWeight: 900,
              background: `linear-gradient(90deg, ${T.accent}, ${T.accentHov})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              lineHeight: 1.2,
            }}>
              Bold Fashion
            </Typography>
          </Box>

          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(7, 1fr)" },
            gap: { xs: "0.5rem", md: "0.9rem" },
            alignItems: "center", justifyItems: "center", mt: 4,
          }}>
            {fashionImages.slice(0, 3).map((item, i) => (
              <Box key={i} component="img" src={item.src} alt={`Fashion ${i + 1}`}
                sx={{ borderRadius: "1.1rem", width: "100%", height: { xs: item.hXs, md: item.hMd }, objectFit: "cover", transition: "transform 0.4s ease", "&:hover": { transform: "scale(1.04)" } }}
              />
            ))}
            <PrimaryBtn component={Link} href="/user/products" sx={{ px: "1.4rem", py: "0.6rem", fontSize: "0.82rem", whiteSpace: "nowrap" }}>
              Explore Products
            </PrimaryBtn>
            {fashionImages.slice(3, 6).map((item, i) => (
              <Box key={i + 3} component="img" src={item.src} alt={`Fashion ${i + 4}`}
                sx={{ borderRadius: "1.1rem", width: "100%", height: { xs: item.hXs, md: item.hMd }, objectFit: "cover", transition: "transform 0.4s ease", "&:hover": { transform: "scale(1.04)" } }}
              />
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Recently Viewed  [surface1 — tinted] ─────────────────────────── */}
      {recentlyViewed.length > 0 && (
        <Box component="section" sx={{ width: "100%", bgcolor: T.surface1, ...sxPad }}>
          <Box sx={sxInner}>
            <Box sx={sxHeading}>
              <Eyebrow>History</Eyebrow>
              <Typography variant="h2" sx={{ fontSize: { xs: "1.9rem", md: "2.5rem" }, fontWeight: 800, color: T.ink, mt: 0.5 }}>
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

      {/* ── Footer  [dark] ────────────────────────────────────────────────── */}
      <Box
        component="footer"
        sx={{
          width:  "100%",
          bgcolor: T.dark,
          color:   T.onDark,
          pt: { xs: "3.5rem", md: "5rem" },
          pb: { xs: "2rem",   md: "2.5rem" },
          px: { xs: "1.5rem", md: "2.5rem" },
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "3rem", width: "100%", maxWidth: 1400, mx: "auto" }}>

          {/* Brand */}
          <Box sx={{ flex: 1.5, minWidth: 230 }}>
            <Typography sx={{ fontFamily: "'Orbitron', sans-serif", fontSize: "1.3rem", fontWeight: 800, mb: 1.5, letterSpacing: "0.07em", color: T.onDark }}>
              SHOPSPHERE
            </Typography>
            <Typography sx={{ fontSize: "0.88rem", lineHeight: 1.8, color: T.onDarkDim, maxWidth: 270 }}>
              Redefining shopping through innovation — AI, AR, and Live Commerce.
            </Typography>
          </Box>

          {/* Quick Links */}
          <Box sx={{ flex: 1, minWidth: 155 }}>
            <Typography sx={{ fontSize: "0.67rem", letterSpacing: "0.22em", textTransform: "uppercase", color: T.glowBlue, mb: 2, fontWeight: 700 }}>
              Quick Links
            </Typography>
            {[
              { label: "About Us",           href: "/footer/quickLinks/about"   },
              { label: "Contact",            href: "/footer/quickLinks/contact" },
              { label: "Privacy Policy",     href: "/footer/quickLinks/privacy" },
              { label: "Terms & Conditions", href: "/footer/quickLinks/terms"   },
            ].map(({ label, href }) => (
              <Box key={label} component={Link} href={href} sx={{
                display: "block", color: T.onDarkDim, mb: "0.55rem",
                fontSize: "0.88rem", textDecoration: "none", transition: "color 0.2s",
                "&:hover": { color: T.onDark },
              }}>
                {label}
              </Box>
            ))}
          </Box>

          {/* Social */}
          <Box sx={{ flex: 1, minWidth: 155 }}>
            <Typography sx={{ fontSize: "0.67rem", letterSpacing: "0.22em", textTransform: "uppercase", color: T.glowBlue, mb: 2, fontWeight: 700 }}>
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

        <Divider sx={{ borderColor: T.borderDark, my: { xs: 3, md: 4 }, maxWidth: 1400, mx: "auto" }} />
        <Typography sx={{ textAlign: "center", fontSize: "0.8rem", color: T.onDarkFaint }}>
          &copy; {new Date().getFullYear()}{" "}
          <strong style={{ color: T.onDarkDim }}>ShopSphere</strong>.{" "}
          All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <ProtectedRoute role="user">
      <HomeContent />
      <ChatbotWrapper />
    </ProtectedRoute>
  );
}
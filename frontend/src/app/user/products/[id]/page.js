"use client";

import React, { use, useEffect, useState } from "react";
import NextImage from "next/image";
import { notFound } from "next/navigation";
import { useDispatch } from "react-redux";
import { addItemToCart } from "../../../../../redux/CartSlice";
import { addToWishlist } from "../../../../../redux/WishlistSlice";
import MiniCart from "../../../../../components/MiniCart";
import MiniWishlist from "../../../../../components/MiniWishlist";
import ARViewer from "../../../../../components/ARViewer";
import { auth } from "../../../../../firebase/config";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Chip,
  Divider,
} from "@mui/material";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ViewInArIcon from "@mui/icons-material/ViewInAr";
import WomanIcon from "@mui/icons-material/Woman";
import ManIcon from "@mui/icons-material/Man";
import CategoryIcon from "@mui/icons-material/Category";
import EventIcon from "@mui/icons-material/Event";
import StyleIcon from "@mui/icons-material/Style";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

async function fetchProduct(productId) {
  const res = await fetch(`${BASE_URL}/api/products/${productId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
}

function ARBannerIllustration({ onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        
        position: "relative",
        width: "100%",
        borderRadius: "14px",
        overflow: "hidden",
        background: "var(--accent-gradient)",
        py: 5,
        px: 3,
        display: "flex",
        alignItems: "center",
        gap: 2,
        boxShadow: "0 4px 24px rgba(30,42,64,0.18)",
        border: "1.5px solid var(--blue-light)",
        cursor: "pointer",
        transition: "all 0.22s cubic-bezier(.4,0,.2,1)",
        "&:hover": {
          boxShadow: "0 8px 36px rgba(62,91,169,0.28)",
          transform: "translateY(-2px)",
          filter: "brightness(1.07)",
        },
        "&:active": {
          transform: "translateY(0px)",
        },
      }}
    >
      {/* Corner brackets */}
      {[
        { top: 10, left: 10, borderTop: "2px solid rgba(255,255,255,0.55)", borderLeft: "2px solid rgba(255,255,255,0.55)" },
        { top: 10, right: 10, borderTop: "2px solid rgba(255,255,255,0.55)", borderRight: "2px solid rgba(255,255,255,0.55)" },
        { bottom: 10, left: 10, borderBottom: "2px solid rgba(255,255,255,0.55)", borderLeft: "2px solid rgba(255,255,255,0.55)" },
        { bottom: 10, right: 10, borderBottom: "2px solid rgba(255,255,255,0.55)", borderRight: "2px solid rgba(255,255,255,0.55)" },
      ].map((style, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            width: 16,
            height: 16,
            ...style,
            borderRadius: "2px",
          }}
        />
      ))}

      {/* AR Icon pulse */}
      <Box
        sx={{
          position: "relative",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 60,
            height: 60,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.13)",
            animation: "arPulse 2s ease-in-out infinite",
            "@keyframes arPulse": {
              "0%, 100%": { transform: "scale(1)", opacity: 0.7 },
              "50%": { transform: "scale(1.45)", opacity: 0.15 },
            },
          }}
        />
        <ViewInArIcon sx={{ fontSize: 38, color: "#fff", position: "relative", zIndex: 1 }} />
      </Box>

      {/* Text */}
      <Box>
        <Typography
          sx={{
            color: "#fff",
            fontWeight: 800,
            fontSize: "0.95rem",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            lineHeight: 1.2,
          }}
        >
          Augmented Reality Try‑On
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: "0.77rem", mt: 0.4 }}>
          See how it looks on you — before you buy
        </Typography>
      </Box>

      {/* TRY ON pill — right */}
      <Box
        sx={{
          ml: "auto",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          bgcolor: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.35)",
          borderRadius: "30px",
          px: 2,
          py: 0.75,
        }}
      >
        <ViewInArIcon sx={{ fontSize: 18, color: "#fff" }} />
        <Typography
          sx={{
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.8rem",
            letterSpacing: 1.2,
            textTransform: "uppercase",
          }}
        >
          Try On
        </Typography>
      </Box>

      {/* Floating dots */}
      {[
        { width: 5, height: 5, top: "22%", right: "43%", animDelay: "0s" },
        { width: 3, height: 3, top: "66%", right: "39%", animDelay: "0.65s" },
        { width: 7, height: 7, top: "38%", right: "49%", animDelay: "1.3s" },
      ].map((dot, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            width: dot.width,
            height: dot.height,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.55)",
            top: dot.top,
            right: dot.right,
            animation: `floatDot 3s ease-in-out infinite`,
            animationDelay: dot.animDelay,
            "@keyframes floatDot": {
              "0%, 100%": { transform: "translateY(0)" },
              "50%": { transform: "translateY(-6px)" },
            },
          }}
        />
      ))}
    </Box>
  );
}

export default function ProductDetailsPage({ params }) {
  const { id } = use(params);
  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [miniCartVisible, setMiniCartVisible] = useState(false);
  const [miniWishlistVisible, setMiniWishlistVisible] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const [analyzeMode, setAnalyzeMode] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      const data = await fetchProduct(id);
      if (!data) notFound();
      else setProduct(data);
    }
    if (id) loadProduct();
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const viewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
    const filtered = viewed.filter((p) => p._id !== product._id);
    filtered.unshift({
      id,
      _id: product._id,
      productDisplayName: product.productDisplayName,
      price: product.price,
      imageFilename: product.imageFilename,
      storeId: product.storeId,
    });
    localStorage.setItem("recentlyViewed", JSON.stringify(filtered.slice(0, 5)));
  }, [product]);

const handleAddToCart = async () => {              // ✅ make async
  const item = {
    id:      product._id,
    name:    product.productDisplayName,
    price:   product.price,
    image:   `${BASE_URL}/images/${product.imageFilename}`,
    storeId: product.storeId,
  };

  dispatch(addItemToCart(item));                   // optimistic update (unchanged)

  // ✅ NEW: if logged in, also persist to DB
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    await fetch(`${BASE_URL}/api/cart`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        Authorization:   `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    });
  }

  setMiniCartVisible(true);
  setTimeout(() => setMiniCartVisible(false), 3000);
};

const handleAddToWishlist = async () => {        // make async
  const item = {
    id:      product._id,
    name:    product.productDisplayName,
    price:   product.price,
    image:   `${BASE_URL}/images/${product.imageFilename}`,
    storeId: product.storeId,
  };
 
  dispatch(addToWishlist(item));                 // optimistic update (unchanged)
 
  // ✅ NEW: if logged in, also persist to DB
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    await fetch(`${BASE_URL}/api/wishlist`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    });
  }
 
  setMiniWishlistVisible(true);
  setTimeout(() => setMiniWishlistVisible(false), 3000);
};

  if (!product) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress sx={{ color: "var(--blue-light)" }} />
      </Box>
    );
  }

  const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;

  const metaChips = [
    product.gender && {
      label: product.gender,
      icon: product.gender === "Women"
        ? <WomanIcon fontSize="small" />
        : <ManIcon fontSize="small" />,
    },
    product.usage && { label: product.usage, icon: <StyleIcon fontSize="small" /> },
    product.season && { label: product.season, icon: <LocalOfferIcon fontSize="small" /> },
    product.masterCategory && { label: product.masterCategory, icon: <CategoryIcon fontSize="small" /> },
    product.year && { label: `Est. ${product.year}`, icon: <EventIcon fontSize="small" /> },
  ].filter(Boolean);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: { xs: 3, md: 5 },
        maxWidth: 1120,
        mx: "auto",
        px: { xs: 2, md: 4 },
    
      pt: { xs: 6, md: 10 },
      pb: { xs: 3, md: 5 },
      }}
    >
      {/* ── IMAGE PANEL ── */}
      <Box
        sx={{
          flex: "0 0 auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          borderRadius: "18px",
          overflow: "hidden",
          background: "white",
          border: "1.5px solid var(--border)",
          boxShadow: "var(--card-shadow)",
          p: 1,
        }}
      >
        <NextImage
          src={imageSrc}
          alt={product.productDisplayName}
          width={480}
          height={480}
          style={{ display: "block", objectFit: "contain", borderRadius: "12px" }}
        />
      </Box>

      {/* ── DETAIL PANEL ── */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2.5 }}>

        {/* Breadcrumb */}
        {product.masterCategory && product.subCategory && (
          <Typography
            variant="caption"
            sx={{
              color: "var(--muted)",
              letterSpacing: 1.2,
              textTransform: "uppercase",
              fontWeight: 500,
              fontSize: "0.72rem",
            }}
          >
            {product.masterCategory} › {product.subCategory}
          </Typography>
        )}

        {/* Product name */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            color: "var(--navy)",
            lineHeight: 1.22,
            letterSpacing: "-0.5px",
          }}
        >
          {product.productDisplayName}
        </Typography>

        {/* Price */}
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "var(--blue-light)",
            letterSpacing: "-0.2px",
          }}
        >
          {product.price
            ? `PKR ${product.price.toLocaleString()}`
            : "Price not available"}
        </Typography>

        {/* Meta chips */}
        {metaChips.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {metaChips.map((chip, i) => (
              <Chip
                key={i}
                icon={React.cloneElement(chip.icon, {
                  style: { color: "var(--blue-light)" },
                })}
                label={chip.label}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.76rem",
                  bgcolor: "var(--blue-soft)",
                  border: "1px solid var(--border)",
                  color: "var(--navy)",
                  "& .MuiChip-icon": { color: "var(--blue-light)" },
                  borderRadius: "8px",
                }}
              />
            ))}
          </Box>
        )}

        <Divider sx={{ borderColor: "var(--border)" }} />

        {/* Attributes */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 1.5,
            bgcolor: "var(--section-bg)",
            borderRadius: "12px",
            p: 2,
            border: "1px solid var(--border)",
          }}
        >
          {[
            { label: "Color", value: product.baseColour },
            { label: "Type", value: product.articleType },
            product.gender && { label: "For", value: product.gender },
            product.usage && { label: "Usage", value: product.usage },
          ]
            .filter(Boolean)
            .map((attr, i) => (
              <Box key={i}>
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    mb: 0.25,
                  }}
                >
                  {attr.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.92rem",
                    fontWeight: 600,
                    color: "var(--navy)",
                  }}
                >
                  {attr.value}
                </Typography>
              </Box>
            ))}
        </Box>

        <Divider sx={{ borderColor: "var(--border)" }} />

        {/* Action buttons */}
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={<ShoppingCartOutlinedIcon />}
            onClick={handleAddToCart}
            sx={{
              px: 3.5,
              py: 1.35,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              background: "var(--navy)",
              color: "var(--white)",
              boxShadow: "0 4px 16px rgba(30,42,64,0.18)",
              letterSpacing: 0.2,
              "&:hover": {
                background: "var(--accent-gradient)",
                filter: "brightness(1.1)",
                boxShadow: "0 6px 22px rgba(62,91,169,0.28)",
              },
            }}
          >
            Add to Cart
          </Button>

          <Button
            variant="outlined"
            startIcon={<FavoriteBorderIcon />}
            onClick={handleAddToWishlist}
            sx={{
              px: 3.5,
              py: 1.35,
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "var(--blue-light)",
              borderColor: "var(--blue-light)",
              letterSpacing: 0.2,
              "&:hover": {
                bgcolor: "var(--blue-soft)",
                borderColor: "var(--blue)",
                color: "var(--blue)",
              },
            }}
          >
            Wishlist
          </Button>
        </Box>

        {/* AR Banner */}
     {/* AR Banner */}
{product.isAREnabled ? (
  <ARBannerIllustration
    onClick={() => {
      setShowAR(true);
      setAnalyzeMode(true);
    }}
  />
) : (
  <Box
    sx={{
      width: "100%",
      borderRadius: "14px",
      background: "var(--section-bg)",
      border: "1.5px dashed var(--border)",
      py: 2.5,
      px: 3,
      display: "flex",
      alignItems: "center",
      gap: 2,
      opacity: 0.6,
      cursor: "not-allowed",
    }}
  >
    <ViewInArIcon sx={{ fontSize: 34, color: "var(--muted)" }} />
    <Box>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "0.9rem",
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: 1.2,
        }}
      >
        AR Try‑On Unavailable
      </Typography>
      <Typography sx={{ fontSize: "0.76rem", color: "var(--muted)", mt: 0.3 }}>
        This product requires a white-background front-pose image for AR.
      </Typography>
    </Box>
  </Box>
)}
      </Box>

      {/* Mini Cart / Wishlist */}
      <MiniCart visible={miniCartVisible} onClose={() => setMiniCartVisible(false)} />
      <MiniWishlist visible={miniWishlistVisible} onClose={() => setMiniWishlistVisible(false)} />

      {/* AR Viewer */}
      {showAR && (
        <ARViewer
          product={product}
          baseUrl={BASE_URL}
          openAnalyze={analyzeMode}
          onClose={() => {
            setShowAR(false);
            setAnalyzeMode(false);
          }}
        />
      )}
    </Box>
  );
}
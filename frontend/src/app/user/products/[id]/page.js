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

// AR Banner Illustration — inline SVG, no external deps
function ARBannerIllustration({ onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        position: "relative",
        width: "100%",
        borderRadius: 3,
        overflow: "hidden",
        background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
        py: 3,
        px: 3,
        display: "flex",
        alignItems: "center",
        gap: 2,
        boxShadow: "0 8px 32px rgba(0,200,255,0.15)",
        border: "1.5px solid rgba(0,200,255,0.18)",
        cursor: "pointer",
        transition: "all 0.25s ease",
        "&:hover": {
          boxShadow: "0 6px 36px rgba(0,200,255,0.35)",
          borderColor: "rgba(0,200,255,0.45)",
          transform: "translateY(-2px)",
        },
        "&:active": {
          transform: "translateY(0px)",
        },
      }}
    >
      {/* Animated corner brackets */}
      {[
        { top: 10, left: 10, borderTop: "3px solid #00c8ff", borderLeft: "3px solid #00c8ff" },
        { top: 10, right: 10, borderTop: "3px solid #00c8ff", borderRight: "3px solid #00c8ff" },
        { bottom: 10, left: 10, borderBottom: "3px solid #00c8ff", borderLeft: "3px solid #00c8ff" },
        { bottom: 10, right: 10, borderBottom: "3px solid #00c8ff", borderRight: "3px solid #00c8ff" },
      ].map((style, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            width: 18,
            height: 18,
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
            width: 64,
            height: 64,
            borderRadius: "50%",
            bgcolor: "rgba(0,200,255,0.12)",
            animation: "arPulse 2s ease-in-out infinite",
            "@keyframes arPulse": {
              "0%, 100%": { transform: "scale(1)", opacity: 0.7 },
              "50%": { transform: "scale(1.4)", opacity: 0.2 },
            },
          }}
        />
        <ViewInArIcon sx={{ fontSize: 42, color: "#00c8ff", position: "relative", zIndex: 1 }} />
      </Box>

      {/* Text */}
      <Box>
        <Typography
          sx={{
            color: "#00c8ff",
            fontWeight: 800,
            fontSize: "1rem",
            letterSpacing: 2,
            textTransform: "uppercase",
            lineHeight: 1.2,
          }}
        >
          Augmented Reality Try-On
        </Typography>
        <Typography sx={{ color: "rgba(255,255,255,0.65)", fontSize: "0.78rem", mt: 0.4 }}>
          See how it looks on you — before you buy
        </Typography>
      </Box>

      {/* TRY ON label — right side */}
      <Box
        sx={{
          ml: "auto",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 1,
          bgcolor: "rgba(0,200,255,0.12)",
          border: "1px solid rgba(0,200,255,0.4)",
          borderRadius: 2,
          px: 2,
          py: 1,
        }}
      >
        <ViewInArIcon sx={{ fontSize: 20, color: "#00c8ff" }} />
        <Typography
          sx={{
            color: "#00c8ff",
            fontWeight: 800,
            fontSize: "0.85rem",
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          Try On
        </Typography>
      </Box>

      {/* Floating dots decoration */}
      {[
        { width: 6, height: 6, top: "20%", right: "42%", animDelay: "0s" },
        { width: 4, height: 4, top: "65%", right: "38%", animDelay: "0.6s" },
        { width: 8, height: 8, top: "35%", right: "48%", animDelay: "1.2s" },
      ].map((dot, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            width: dot.width,
            height: dot.height,
            borderRadius: "50%",
            bgcolor: "#00c8ff",
            top: dot.top,
            right: dot.right,
            opacity: 0.3,
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

  const handleAddToCart = () => {
    dispatch(addItemToCart({
      id: product._id,
      name: product.productDisplayName,
      price: product.price,
      image: `${BASE_URL}/images/${product.imageFilename}`,
      storeId: product.storeId,
    }));
    setMiniCartVisible(true);
    setTimeout(() => setMiniCartVisible(false), 3000);
  };

  const handleAddToWishlist = () => {
    dispatch(addToWishlist({
      id: product._id,
      name: product.productDisplayName,
      price: product.price,
      image: `${BASE_URL}/images/${product.imageFilename}`,
      storeId: product.storeId,
    }));
    setMiniWishlistVisible(true);
    setTimeout(() => setMiniWishlistVisible(false), 3000);
  };

  if (!product) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;

  const metaChips = [
    product.gender && { label: product.gender, icon: product.gender === "Women" ? <WomanIcon fontSize="small" /> : <ManIcon fontSize="small" /> },
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
        gap: 4,
        maxWidth: 1100,
        mx: "auto",
        px: { xs: 2, md: 4 },
        py: 4,
      }}
    >
      {/* === PRODUCT IMAGE === */}
      <Box
        sx={{
          flex: "0 0 auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 3,
          bgcolor: "#f9f9f9",
        }}
      >
        <NextImage
          src={imageSrc}
          alt={product.productDisplayName}
          width={500}
          height={500}
          style={{ display: "block", objectFit: "contain" }}
        />
      </Box>

      {/* === PRODUCT DETAILS === */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>

        {/* Category breadcrumb */}
        {product.masterCategory && product.subCategory && (
          <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: 1, textTransform: "uppercase" }}>
            {product.masterCategory} › {product.subCategory}
          </Typography>
        )}

        <Typography variant="h4" fontWeight={700}>
          {product.productDisplayName}
        </Typography>

        <Typography variant="h5" sx={{ color: "primary.main", fontWeight: 600 }}>
          {product.price
            ? `PKR ${product.price.toLocaleString()}`
            : "Price not available"}
        </Typography>

        {/* Meta chips row */}
        {metaChips.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {metaChips.map((chip, i) => (
              <Chip
                key={i}
                icon={chip.icon}
                label={chip.label}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 500, fontSize: "0.78rem" }}
              />
            ))}
          </Box>
        )}

        <Divider />

        {/* Product attributes */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="body1">
            <Box component="span" fontWeight={600}>Color: </Box>
            {product.baseColour}
          </Typography>
          <Typography variant="body1">
            <Box component="span" fontWeight={600}>Type: </Box>
            {product.articleType}
          </Typography>
          {product.gender && (
            <Typography variant="body1">
              <Box component="span" fontWeight={600}>For: </Box>
              {product.gender}
            </Typography>
          )}
          {product.usage && (
            <Typography variant="body1">
              <Box component="span" fontWeight={600}>Usage: </Box>
              {product.usage}
            </Typography>
          )}
        </Box>

        <Divider />

        {/* === ACTION BUTTONS === */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ShoppingCartOutlinedIcon />}
            onClick={handleAddToCart}
            sx={{
              px: 3,
              py: 1.25,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            Add to Cart
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            startIcon={<FavoriteBorderIcon />}
            onClick={handleAddToWishlist}
            sx={{
              px: 3,
              py: 1.25,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1rem",
            }}
          >
            Wishlist
          </Button>
        </Box>

        {/* === AR SECTION — clickable banner === */}
        <ARBannerIllustration
          onClick={() => {
            setShowAR(true);
            setAnalyzeMode(true);
          }}
        />
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
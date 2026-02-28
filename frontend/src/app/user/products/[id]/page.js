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
} from "@mui/material";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ViewInArIcon from "@mui/icons-material/ViewInAr";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

async function fetchProduct(productId) {
  const res = await fetch(`${BASE_URL}/api/products/${productId}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
}

export default function ProductDetailsPage({ params }) {
  const { id } = use(params);

  const dispatch = useDispatch();
  const [product, setProduct] = useState(null);
  const [miniCartVisible, setMiniCartVisible] = useState(false);
  const [miniWishlistVisible, setMiniWishlistVisible] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const [analyzeMode, setAnalyzeMode] = useState(false);

  // === Fetch Product ===
  useEffect(() => {
    async function loadProduct() {
      const data = await fetchProduct(id);
      if (!data) notFound();
      else setProduct(data);
    }
    if (id) loadProduct();
  }, [id]);

  // === Recently Viewed ===
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;

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
          style={{ objectFit: "cover", display: "block" }}
        />
      </Box>

      {/* === PRODUCT DETAILS === */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h4" fontWeight={700}>
          {product.productDisplayName}
        </Typography>

        <Typography
          variant="h5"
          sx={{ color: "primary.main", fontWeight: 600 }}
        >
          {product.price
            ? `PKR ${product.price.toLocaleString()}`
            : "Price not available"}
        </Typography>

        <Typography variant="body1">
          <Box component="span" fontWeight={600}>Color: </Box>
          {product.baseColour}
        </Typography>

        <Typography variant="body1">
          <Box component="span" fontWeight={600}>Type: </Box>
          {product.articleType}
        </Typography>

        {/* === ACTION BUTTONS === */}
        <Box sx={{ display: "flex", gap: 2, mt: 1, flexWrap: "wrap" }}>
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

        {/* === TRY-ON BUTTON === */}
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<ViewInArIcon />}
            onClick={() => {
              setShowAR(true);
              setAnalyzeMode(true);
            }}
            title="TRY-ON"
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: 1,
            }}
          >
            TRY-ON
          </Button>
        </Box>
      </Box>

      {/* Mini Cart / Wishlist */}
      <MiniCart
        visible={miniCartVisible}
        onClose={() => setMiniCartVisible(false)}
      />
      <MiniWishlist
        visible={miniWishlistVisible}
        onClose={() => setMiniWishlistVisible(false)}
      />

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
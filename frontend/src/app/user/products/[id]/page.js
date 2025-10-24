"use client";

import React, { use,useEffect, useState } from "react";
import NextImage from "next/image";
import { notFound } from "next/navigation";
import { useDispatch } from "react-redux";
import { addItemToCart } from "../../../../../redux/CartSlice";
import { addToWishlist } from "../../../../../redux/WishlistSlice";
import styles from "../../../../styles/ProductDetails.module.css";
import MiniCart from "../../../../../components/MiniCart";
import MiniWishlist from "../../../../../components/MiniWishlist";
import { Camera } from "lucide-react";
import ARViewer from "../../../../../components/ARViewer";

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

  // === Recently viewed ===
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

  if (!product) return <p>Loading product details...</p>;
  const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;

  return (
    <div className={styles.container}>
      <div className={styles.imageWrapper}>
        <NextImage src={imageSrc} alt={product.productDisplayName} width={500} height={500} />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            className={styles.cameraIcon}
            onClick={() => { setShowAR(true); setAnalyzeMode(false); }}
            title="Open AR"
          >
            <Camera size={22} />
          </button>
          <button
            className={styles.cameraIcon}
            onClick={() => { setShowAR(true); setAnalyzeMode(true); }}
            title="Analyze measurements"
            style={{ background: "#0b74de", color: "#fff", padding: "8px 10px", borderRadius: 8 }}
          >
            Analyze Measurements
          </button>
        </div>
      </div>

      <div className={styles.details}>
        <h1>{product.productDisplayName}</h1>
        <p className={styles.price}>
          {product.price ? `PKR ${product.price.toLocaleString()}` : "Price not available"}
        </p>
        <p><strong>Color:</strong> {product.baseColour}</p>
        <p><strong>Type:</strong> {product.articleType}</p>

        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAddToCart}>
            Add to Cart
          </button>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handleAddToWishlist}>
            Wishlist
          </button>
        </div>
      </div>

      <MiniCart visible={miniCartVisible} onClose={() => setMiniCartVisible(false)} />
      <MiniWishlist visible={miniWishlistVisible} onClose={() => setMiniWishlistVisible(false)} />

      {/* ✅ Clean AR component integration */}
      {showAR && (
        <ARViewer
          product={product}
          baseUrl={BASE_URL}
          openAnalyze={analyzeMode}
          onClose={() => { setShowAR(false); setAnalyzeMode(false); }}
        />
      )}
    </div>
  );
}

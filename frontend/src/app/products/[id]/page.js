"use client";

import React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { useDispatch } from "react-redux";
import { addItemToCart } from "../../../../redux/CartSlice";
import { addToWishlist } from "../../../../redux/WishlistSlice";
import styles from "../../../styles/ProductDetails.module.css";
import MiniCart from "../../../../components/MiniCart";
import MiniWishlist from "../../../../components/MiniWishlist";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

async function fetchProduct(productId) {
  const res = await fetch(`${BASE_URL}/api/products/${productId}`, {
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
}

export default function ProductDetailsPage({ params: paramsPromise }) {
  const params = React.use(paramsPromise);
  const { id } = params;

  const dispatch = useDispatch();
  const [product, setProduct] = React.useState(null);

  // Mini previews state
  const [miniCartVisible, setMiniCartVisible] = React.useState(false);
  const [miniWishlistVisible, setMiniWishlistVisible] = React.useState(false);

  React.useEffect(() => {
    async function loadProduct() {
      const data = await fetchProduct(id);
      if (!data) {
        notFound();
      } else {
        setProduct(data);
      }
    }
    loadProduct();
  }, [id]);

  // Store recently viewed products
  React.useEffect(() => {
    if (product) {
      const viewed = JSON.parse(localStorage.getItem("recentlyViewed")) || [];
      const filtered = viewed.filter((p) => p._id !== product._id);
      filtered.unshift({
        _id: product._id,
        productDisplayName: product.productDisplayName,
        price: product.price,
        imageFilename: product.imageFilename,
        storeId: product.storeId,
      });
      const limited = filtered.slice(0, 5);
      localStorage.setItem("recentlyViewed", JSON.stringify(limited));
    }
  }, [product]);

  if (!product) return <p>Loading...</p>;

  const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;

  // Add to Cart with mini preview
  const handleAddToCart = () => {
    dispatch(
      addItemToCart({
        id: product._id,
        name: product.productDisplayName,
        price: product.price,
        image: imageSrc,
        storeId: product.storeId,
      })
    );
    setMiniCartVisible(true);
    // Optional: auto-hide after 3s
    setTimeout(() => setMiniCartVisible(false), 3000);
  };

  // Add to Wishlist with mini preview
  const handleAddToWishlist = () => {
    dispatch(
      addToWishlist({
        id: product._id,
        name: product.productDisplayName,
        price: product.price,
        image: imageSrc,
        storeId: product.storeId,
      })
    );
    setMiniWishlistVisible(true);
    setTimeout(() => setMiniWishlistVisible(false), 3000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.imageWrapper}>
        <Image
          src={imageSrc}
          alt={product.productDisplayName || "Product"}
          width={500}
          height={500}
        />
      </div>

      <div className={styles.details}>
        <h1>{product.productDisplayName}</h1>
        <p className={styles.price}>
          {product.price ? `PKR ${product.price.toLocaleString()}` : "Price not available"}
        </p>
        <p><strong>Color:</strong> {product.baseColour}</p>
        <p><strong>Type:</strong> {product.articleType}</p>

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handleAddToWishlist}
          >
            Wishlist
          </button>
        </div>
      </div>

      {/* Mini previews */}
      <MiniCart visible={miniCartVisible} onClose={() => setMiniCartVisible(false)} />
      <MiniWishlist visible={miniWishlistVisible} onClose={() => setMiniWishlistVisible(false)} />
    </div>
  );
}

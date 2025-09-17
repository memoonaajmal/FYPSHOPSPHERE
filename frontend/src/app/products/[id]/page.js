"use client";

import React from "react";
import Image from "next/image";
import { notFound, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { addItemToCart } from "../../../../redux/CartSlice";
import { addToWishlist } from "../../../../redux/WishlistSlice";
import styles from "../../../styles/ProductDetails.module.css";

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
  const router = useRouter();
  const [product, setProduct] = React.useState(null);

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

  if (!product) return <p>Loading...</p>;

  const imageSrc = `${BASE_URL.replace(/\/$/, "")}/images/${product.imageFilename}`;

  const handleAddToCart = () => {
    dispatch(
      addItemToCart({
        id: product._id,
        name: product.productDisplayName,
        price: product.price,   // ✅ real price
        image: imageSrc,
      })
    );

    router.push("/cart");
  };

  const handleAddToWishlist = () => {
    dispatch(
      addToWishlist({
        id: product._id,
        name: product.productDisplayName,
        price: product.price,   // ✅ real price
        image: imageSrc,
      })
    );

    router.push("/wishlist");
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
    </div>
  );
}

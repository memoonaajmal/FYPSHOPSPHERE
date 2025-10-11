// components/MiniWishlist.js
"use client";

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeFromWishlist } from "../redux/WishlistSlice";
import { addItemToCart } from "../redux/CartSlice";
import styles from "./styles/MiniCart.module.css"; // reuse cart styles
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function MiniWishlist({ visible, onClose }) {
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const dispatch = useDispatch();
  const router = useRouter();

  if (!visible) return null;

  const handleAddToCart = (item) => {
    dispatch(addItemToCart(item));
    onClose(); // close mini wishlist after adding to cart
  };

  return (
    <div className={styles.miniCartWrapper}>
      <div className={styles.miniCartHeader}>
        <h3>Wishlist</h3>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      {wishlistItems.length === 0 ? (
        <p className={styles.emptyMessage}>Your wishlist is empty ❤️</p>
      ) : (
        <div className={styles.miniCartItems}>
          {wishlistItems.slice(-3).map((item) => (
            <div key={item.id} className={styles.cartItem}>
              <Image src={item.image} alt={item.name} width={50} height={50} />
              <div className={styles.itemDetails}>
                <h4>{item.name}</h4>
                <p>PKR {item.price}</p>
              </div>
              
            </div>
          ))}
          <button
            className={styles.checkoutBtn}
            onClick={() => router.push("/wishlist")}
          >
            View Wishlist
          </button>
        </div>
      )}
    </div>
  );
}

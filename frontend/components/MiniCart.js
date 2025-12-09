"use client";

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeItemFromCart } from "../redux/CartSlice";
import styles from "./styles/MiniCart.module.css"; 
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function MiniCart({ visible, onClose }) {
  const cartItems = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();
  const router = useRouter();

  if (!visible) return null;

  return (
    <div className={styles.miniCartWrapper}>
      <div className={styles.miniCartHeader}>
        <h3>Cart</h3>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
      </div>

      {cartItems.length === 0 ? (
        <p className={styles.emptyMessage}>Your cart is empty 🛒</p>
      ) : (
        <>
          <div className={styles.miniCartItems}>
            {cartItems.slice(-3).map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <Image src={item.image} alt={item.name} width={50} height={50} />
                <div className={styles.itemDetails}>
                  <h4>{item.name}</h4>
                  <p>PKR {item.price} × {item.qty}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            className={styles.checkoutBtn}
            onClick={() => router.push("/user/cart")}
          >
            View Cart
          </button>
        </>
      )}
    </div>
  );
}

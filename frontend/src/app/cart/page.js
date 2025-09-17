"use client";
import styles from "../../styles/Cart.module.css";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeItemFromCart, clearCart, increaseQty, decreaseQty } from "../../../redux/CartSlice";
import Image from "next/image";
import { useRouter } from "next/navigation"; // ✅ added

export default function CartPage() {
  const cartItems = useSelector((state) => state.cart.items);
  const [hasMounted, setHasMounted] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter(); // ✅ added

  useEffect(() => setHasMounted(true), []);

  const total = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);

  if (!hasMounted) return null; // Avoid hydration mismatch

  if (cartItems.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <h2>Your cart is empty 🛒</h2>
      </div>
    );
  }

  return (
    <div className={styles.cartContainer}>
      <h1>Your Shopping Cart</h1>

      <div className={styles.cartItems}>
        {cartItems.map((item) => (
          <div key={item.id} className={styles.cartItem}>
            <Image src={item.image} alt={item.name} width={80} height={80} />
            <div className={styles.itemDetails}>
              <h3>{item.name}</h3>
              <p>PKR {item.price} x {item.qty}</p>

              <div className={styles.qtyControls}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => dispatch(decreaseQty(item.id))}
                >
                  −
                </button>
                <span className={styles.qtyValue}>{item.qty}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() => dispatch(increaseQty(item.id))}
                >
                  +
                </button>
              </div>

              <button
                className={styles.removeBtn}
                onClick={() => dispatch(removeItemFromCart(item.id))}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.cartSummary}>
        <h2>Total: PKR {total.toFixed(2)}</h2>
        <button
          className={styles.clearBtn}
          onClick={() => dispatch(clearCart())}
        >
          Clear Cart
        </button>
        <button
          className={styles.checkoutBtn}
          onClick={() => router.push("/checkout")} // ✅ added
        >
          Checkout
        </button>
        <button
  className={styles.clearBtn} // ✅ reuse styling
  onClick={() => router.push("/products")}
>
  Continue Shopping
</button>

      </div>
    </div>
  );
}

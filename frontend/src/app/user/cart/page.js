"use client";
import styles from "../../../styles/Cart.module.css";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  removeItemFromCart,
  clearCart,
  increaseQty,
  decreaseQty,
} from "../../../../redux/CartSlice";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function CartPage() {
  const cartItems = useSelector((state) => state.cart.items);
  const [hasMounted, setHasMounted] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => setHasMounted(true), []);

 
  const total = cartItems.reduce(
    (acc, item) => acc + ((item.price || 0) * (item.qty || 1)),
    0
  );

  if (!hasMounted) return null;

  if (cartItems.length === 0) {
    return (
      <div className={styles.emptyCartPage}>
  <div className={styles.emptyCart}>
    <img
      src="/images/emptycart.png"
      alt="Empty cart"
      className={styles.emptyCartImage}
    />
    <h2>Empty Cart</h2>
    <p>Looks like you haven't made your choice yet.</p>
  </div>
</div>
    );
  }

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear your entire cart?")) {
      dispatch(clearCart());
    }
  };

  return (
    <div className={styles.cartPageWrapper}>
      <div className={styles.cartPage}>
        {/* LEFT SIDE - Items */}
        <div className={styles.cartLeft}>
          <h1 className={styles.cartTitle}>
            Shopping Cart <span>({cartItems.length} items)</span>
          </h1>

          <div className={styles.tableHeader}>
            <span>Product Details</span>
            <span>Quantity</span>
            <span>Price</span>
            <span>Total</span>
          </div>

          <div className={styles.cartItems}>
            {cartItems.map((item) => (
              <div key={item.id} className={styles.cartRow}>
                <div className={styles.productInfo}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={70}
                    height={70}
                    className={styles.productImage}
                  />
                  <div className={styles.productText}>
                    <h3>{item.name}</h3>
                  </div>
                </div>

                <div className={styles.qtyControls}>
                  <button onClick={() => dispatch(decreaseQty(item.id))}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => dispatch(increaseQty(item.id))}>+</button>
                </div>

               
                <p className={styles.itemPrice}>
                  PKR {(item.price || 0).toFixed(2)}
                </p>
                <p className={styles.itemTotal}>
                  PKR {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                </p>

                <button
                  className={styles.removeIcon}
                  onClick={() => dispatch(removeItemFromCart(item.id))}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* BUTTONS BELOW PRODUCTS */}
          <div className={styles.bottomButtons}>
            <button
              className={styles.continueBtn}
              onClick={() => router.push("/user/products")}
            >
              ← Continue Shopping
            </button>

            <div
              className={styles.clearCartContainer}
              onClick={handleClearCart}
            >
              <span> 🗑️ Clear Cart</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Order Summary */}
        <div className={styles.cartRight}>
          <div className={styles.orderSummary}>
            <h2>Order Summary</h2>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>PKR {total.toFixed(2)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>PKR {total.toFixed(2)}</span>
            </div>

            <button
              className={styles.checkoutBtn}
              onClick={() => router.push("/user/checkout")}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

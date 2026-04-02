"use client";
import styles from "../../../styles/Cart.module.css";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
// ✅ ADDED: auth import for DB sync
import { auth } from "../../../../firebase/config";
import {
  removeItemFromCart,
  clearCart,
  increaseQty,
  decreaseQty,
} from "../../../../redux/CartSlice";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

// ✅ ADDED: base URL for API calls
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// ✅ ADDED: helper that silently syncs cart actions to DB for logged-in users
// Guest users are ignored (auth.currentUser will be null)
const syncWithDB = async (method, path, body) => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const token = await user.getIdToken();
    await fetch(`${BASE_URL}/api/cart${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    console.error("Cart DB sync failed:", err);
  }
};

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

  // ✅ UPDATED: also clears DB cart for logged-in users
  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to clear your entire cart?")) {
      dispatch(clearCart());
      await syncWithDB("DELETE", ""); // DELETE /api/cart
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
                  {/* ✅ UPDATED: decrease also syncs to DB */}
                  <button
                    onClick={() => {
                      dispatch(decreaseQty(item.id));
                      // only sync if qty will still be >= 1 after decrease
                      if (item.qty > 1) {
                        syncWithDB("PUT", `/${item.id}`, { qty: item.qty - 1 });
                      }
                    }}
                  >
                    −
                  </button>

                  <span>{item.qty}</span>

                  {/* ✅ UPDATED: increase also syncs to DB */}
                  <button
                    onClick={() => {
                      dispatch(increaseQty(item.id));
                      syncWithDB("PUT", `/${item.id}`, { qty: item.qty + 1 });
                    }}
                  >
                    +
                  </button>
                </div>

                <p className={styles.itemPrice}>
                  PKR {(item.price || 0).toFixed(2)}
                </p>
                <p className={styles.itemTotal}>
                  PKR {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                </p>

                {/* ✅ UPDATED: remove also syncs to DB */}
                <button
                  className={styles.removeIcon}
                  onClick={() => {
                    dispatch(removeItemFromCart(item.id));
                    syncWithDB("DELETE", `/${item.id}`); // DELETE /api/cart/:productId
                  }}
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
              <span>🗑️ Clear Cart</span>
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
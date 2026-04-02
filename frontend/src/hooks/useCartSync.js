// hooks/useCartSync.js
"use client";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/config";

import { setCart, clearCart } from "../../../frontend/redux/CartSlice"; 

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export function useCartSync() {
  const dispatch  = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  // keep a ref so the auth callback always sees the latest guest cart
  const cartItemsRef = useRef(cartItems);
  useEffect(() => { cartItemsRef.current = cartItems; }, [cartItems]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ── USER JUST LOGGED IN ──────────────────────────────
        const token      = await user.getIdToken();
        const guestCart  = cartItemsRef.current;

        if (guestCart.length > 0) {
          // 1. Merge guest cart into DB
          const mergeRes = await fetch(`${BASE_URL}/api/cart/merge`, {
            method:  "POST",
            headers: {
              "Content-Type":  "application/json",
              Authorization:   `Bearer ${token}`,
            },
            body: JSON.stringify({ items: guestCart }),
          });
          if (mergeRes.ok) {
            const merged = await mergeRes.json();
            dispatch(setCart(merged)); // ✅ replace redux with merged DB cart
            return;
          }
        }

        // 2. No guest cart → just load DB cart
        const cartRes = await fetch(`${BASE_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cartRes.ok) {
          const dbCart = await cartRes.json();
          dispatch(setCart(dbCart)); // ✅ hydrate redux from DB
        }
      } else {
        // ── USER LOGGED OUT ──────────────────────────────────
        dispatch(clearCart()); // ✅ wipe redux so next user starts fresh
      }
    });

    return () => unsubscribe();
  }, [dispatch]);
}
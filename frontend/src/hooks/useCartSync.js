// hooks/useCartSync.js
"use client";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/config";

import { setCart, clearCart }         from "../../../frontend/redux/CartSlice";
import { setWishlist, clearWishlist } from "../../../frontend/redux/WishlistSlice"; 

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export function useCartSync() {
  const dispatch       = useDispatch();
  const cartItems      = useSelector((state) => state.cart.items);
  const wishlistItems  = useSelector((state) => state.wishlist.items); 

  // Keep refs so the auth callback always sees the latest guest data
  const cartItemsRef     = useRef(cartItems);
  const wishlistItemsRef = useRef(wishlistItems); 

  useEffect(() => { cartItemsRef.current     = cartItems;     }, [cartItems]);
  useEffect(() => { wishlistItemsRef.current = wishlistItems; }, [wishlistItems]); 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ── USER JUST LOGGED IN ──────────────────────────────
        const token         = await user.getIdToken();
        const guestCart     = cartItemsRef.current;
        const guestWishlist = wishlistItemsRef.current; 

        // ── CART SYNC ────────────────────────────────────────
        if (guestCart.length > 0) {
          const mergeRes = await fetch(`${BASE_URL}/api/cart/merge`, {
            method:  "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:  `Bearer ${token}`,
            },
            body: JSON.stringify({ items: guestCart }),
          });
          if (mergeRes.ok) {
            const merged = await mergeRes.json();
            dispatch(setCart(merged));
          }
        } else {
          // No guest cart → just load DB cart
          const cartRes = await fetch(`${BASE_URL}/api/cart`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (cartRes.ok) {
            const dbCart = await cartRes.json();
            dispatch(setCart(dbCart));
          }
        }

        // ── WISHLIST SYNC ──────────────────────────────────── 
        if (guestWishlist.length > 0) {
          const mergeRes = await fetch(`${BASE_URL}/api/wishlist/merge`, {
            method:  "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:  `Bearer ${token}`,
            },
            body: JSON.stringify({ items: guestWishlist }),
          });
          if (mergeRes.ok) {
            const merged = await mergeRes.json();
            dispatch(setWishlist(merged));
          }
        } else {
          // No guest wishlist → just load DB wishlist
          const wishlistRes = await fetch(`${BASE_URL}/api/wishlist`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (wishlistRes.ok) {
            const dbWishlist = await wishlistRes.json();
            dispatch(setWishlist(dbWishlist));
          }
        }
      } else {
        // ── USER LOGGED OUT ──────────────────────────────────
        dispatch(clearCart());     // ✅ wipe cart so next user starts fresh
        dispatch(clearWishlist()); // ✅ ADDED — wipe wishlist too
      }
    });

    return () => unsubscribe();
  }, [dispatch]);
}
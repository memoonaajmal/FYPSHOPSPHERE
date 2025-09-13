// redux/ReduxStore.js
"use client";
import { configureStore } from "@reduxjs/toolkit";
import CartSlice from "./CartSlice";
import WishlistSlice from "./WishlistSlice";

export const ReduxStore = configureStore({
  reducer: {
    cart: CartSlice,
    wishlist: WishlistSlice,
  },
});

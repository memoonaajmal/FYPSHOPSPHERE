"use client";
import { configureStore } from "@reduxjs/toolkit";
import CartSlice from "./CartSlice";

export const ReduxStore = configureStore({
  reducer: {
    cart: CartSlice,
  },
});

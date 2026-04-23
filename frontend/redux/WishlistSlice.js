"use client";
import { createSlice } from "@reduxjs/toolkit";

const storedWishlist =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("wishlist"))
    : [];

const initialState = {
  items: storedWishlist || [],
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (!existing) {
        state.items.push({ ...action.payload });
      }
      localStorage.setItem("wishlist", JSON.stringify(state.items));
    },

    removeFromWishlist: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      localStorage.setItem("wishlist", JSON.stringify(state.items));
    },

    clearWishlist: (state) => {
      state.items = [];
      localStorage.removeItem("wishlist");
    },

    setWishlist: (state, action) => {
      // DB items use `productId`, redux uses `id` — normalize here
      state.items = action.payload.map((item) => ({
        id:      item.productId ?? item.id,
        storeId: item.storeId,
        name:    item.name,
        price:   item.price,
        image:   item.image,
      }));
      localStorage.setItem("wishlist", JSON.stringify(state.items));
    },
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  setWishlist,   
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
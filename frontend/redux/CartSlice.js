"use client";
import { createSlice } from "@reduxjs/toolkit";

const storedCart =
  typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("cart"))
    : [];

const initialState = {
  items: storedCart || [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addItemToCart: (state, action) => {
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        existing.qty += action.payload.qty || 1;
      } else {
        state.items.push({
          ...action.payload,
          qty: action.payload.qty || 1,
          storeId: action.payload.storeId,
        });
      }
      localStorage.setItem("cart", JSON.stringify(state.items));
    },

    removeItemFromCart: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      localStorage.setItem("cart", JSON.stringify(state.items));
    },

    increaseQty: (state, action) => {
      const item = state.items.find((i) => i.id === action.payload);
      if (item) item.qty += 1;
      localStorage.setItem("cart", JSON.stringify(state.items));
    },

    decreaseQty: (state, action) => {
      const item = state.items.find((i) => i.id === action.payload);
      if (item && item.qty > 1) item.qty -= 1;
      localStorage.setItem("cart", JSON.stringify(state.items));
    },

    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem("cart");
    },

    setCart: (state, action) => {
      // DB items use `productId`, redux uses `id` — normalize here
      state.items = action.payload.map((item) => ({
        id:      item.productId ?? item.id,
        storeId: item.storeId,
        name:    item.name,
        price:   item.price,
        image:   item.image,
        qty:     item.qty,
      }));
      localStorage.setItem("cart", JSON.stringify(state.items));
    },
  },
});

export const {
  addItemToCart,
  removeItemFromCart,
  increaseQty,
  decreaseQty,
  clearCart,
  setCart,       
} = cartSlice.actions;

export default cartSlice.reducer;
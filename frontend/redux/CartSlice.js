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
      // 🔹 action.payload should now include product.storeId
      const existing = state.items.find((item) => item.id === action.payload.id);
      if (existing) {
        existing.qty += action.payload.qty || 1;
      } else {
        state.items.push({
          ...action.payload,
          qty: action.payload.qty || 1,
          storeId: action.payload.storeId, // ✅ ensure storeId is saved
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
  },
});

export const {
  addItemToCart,
  removeItemFromCart,
  increaseQty,
  decreaseQty,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;

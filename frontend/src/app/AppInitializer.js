// app/AppInitializer.js
"use client";
import { useCartSync } from "../hooks/useCartSync";

export default function AppInitializer() {
  useCartSync(); // ✅ runs once at app root, handles login/logout cart sync
  return null;   // renders nothing
}
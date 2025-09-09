"use client";
import Link from "next/link";
import { UserPlus, LogIn } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center shadow-md">
      {/* Left: Logo */}
      <h1 className="text-xl font-bold">
        <Link href="/">MyShop</Link>
      </h1>

      {/* Center: Navigation */}
      <div className="flex gap-6">
        <Link href="/products" className="hover:underline">
          Products
        </Link>
      </div>

      {/* Right: Auth Icons */}
      <div className="flex gap-4">
        <Link href="../signup" className="flex items-center gap-1 hover:underline">
          <UserPlus size={20} />
          <span className="hidden sm:inline">Sign Up</span>
        </Link>
        <Link href="/login" className="flex items-center gap-1 hover:underline">
          <LogIn size={20} />
          <span className="hidden sm:inline">Login</span>
        </Link>
      </div>
    </nav>
  );
}

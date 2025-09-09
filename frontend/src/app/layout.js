import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../../components/Navbar";
import SearchFilterBar from "../../components/FilterBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MyShop",
  description: "E-commerce app with Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* Global Navbar */}
        <Navbar />

        {/* Page Layout */}
        <div className="flex min-h-screen gap-6">
          {/* Sidebar (left) */}
          <aside className="w-64 bg-gray-100 p-4 hidden md:block rounded-xl shadow-md">
            <h2 className="font-bold mb-4">Filters</h2>
            <SearchFilterBar />
          </aside>

          {/* Main Content (right) */}
          <main className="flex-1 p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}

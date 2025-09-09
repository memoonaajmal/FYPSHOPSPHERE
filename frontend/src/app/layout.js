import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../../components/Navbar";
import SearchFilterBar from "../../components/FilterBar";
import styles from "../styles/RootLayout.module.css";

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
        <div className={styles.layoutContainer}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <h2 className="font-bold mb-4">Filters</h2>
            <SearchFilterBar />
          </aside>

          {/* Main Content */}
          <main className={styles.main}>{children}</main>
        </div>
      </body>
    </html>
  );
}

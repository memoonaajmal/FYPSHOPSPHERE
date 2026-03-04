import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../../components/Navbar";
import styles from "../styles/RootLayout.module.css";
import { ReduxProvider } from "./ReduxProvider"; 
import { AuthProvider } from "../context/AuthContext";
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
        <ReduxProvider>
          <AuthProvider>
            <Navbar />
            <div className={styles.layoutContainer}>
              <main className={styles.main}>{children}</main>
            </div>
           
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
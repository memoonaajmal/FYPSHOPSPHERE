"use client";
import styles from "../../../styles/Wishlist.module.css";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeFromWishlist, clearWishlist } from "../../../../redux/WishlistSlice";
import { addItemToCart } from "../../../../redux/CartSlice";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import MiniCart from "../../../../components/MiniCart";
import { auth } from "../../../../firebase/config";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

const syncWishlistWithDB = async (method, path, body) => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const token = await user.getIdToken();
    await fetch(`${BASE_URL}/api/wishlist${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    console.error("Wishlist DB sync failed:", err);
  }
};

const syncCartWithDB = async (method, path, body) => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const token = await user.getIdToken();
    await fetch(`${BASE_URL}/api/cart${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    console.error("Cart DB sync failed:", err);
  }
};

export default function WishlistPage() {
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const [hasMounted, setHasMounted] = useState(false);
  const [miniCartVisible, setMiniCartVisible] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => setHasMounted(true), []);
  if (!hasMounted) return null;

  if (wishlistItems.length === 0) {
    return (
      <div className={styles.emptyCartPage}>
        <div className={styles.emptyCart}>
          <img
            src="/images/emptywishlist.png"
            alt="Empty wishlist"
            className={styles.emptyCartImage}
          />
          <h2>Your wishlist is empty!</h2>
          <p>Explore more and shortlist some items.</p>
        </div>
      </div>
    );
  }

  //UPDATED: also syncs to cart DB + removes from wishlist DB
  const handleAddToCart = async (item) => {
    dispatch(
      addItemToCart({
        id:      item.id,
        name:    item.name,
        price:   item.price,
        image:   item.image,
        storeId: item.storeId,
      })
    );

    // Sync add to cart DB
    await syncCartWithDB("POST", "", {
      id:      item.id,
      storeId: item.storeId,
      name:    item.name,
      price:   item.price,
      image:   item.image,
      qty:     1,
    });

    setMiniCartVisible(true);
    setTimeout(() => setMiniCartVisible(false), 3000);
  };

  //UPDATED: also clears wishlist DB
  const handleClearWishlist = async () => {
    if (window.confirm("Are you sure you want to clear your entire wishlist?")) {
      dispatch(clearWishlist());
      await syncWishlistWithDB("DELETE", ""); // DELETE /api/wishlist
    }
  };

  return (
    <div className={styles.cartPageWrapper}>
      <div className={styles.cartPage}>
        {/* Wishlist (Full Width) */}
        <div className={styles.cartLeft} style={{ flex: "1 1 100%" }}>
          <h2 className={styles.cartTitle}>
            Your Wishlist <span>({wishlistItems.length} items)</span>
          </h2>

          {/* Header */}
          <div className={styles.tableHeader}>
            <span>Product</span>
            <span>Price</span>
            <span>Actions</span>
          </div>

          {/* Wishlist Items */}
          {wishlistItems.map((item) => (
            <div key={item.id} className={styles.cartRow}>
              <div className={styles.productInfo}>
                <Image
                  src={item.image}
                  alt={item.name}
                  width={80}
                  height={80}
                  className={styles.productImage}
                />
                <div className={styles.productText}>
                  <h3>{item.name}</h3>
                  {item.category && (
                    <p className={styles.itemCategory}>{item.category}</p>
                  )}
                </div>
              </div>

              <div className={styles.itemPrice}>PKR {item.price}</div>

              {/* Add to Cart + Remove X side by side */}
              <div className={styles.actionsContainer}>
                <button
                  className={styles.addBtn}
                  onClick={() => handleAddToCart(item)}
                >
                  Add to Cart
                </button>

                {/* ✅ UPDATED: remove also syncs to DB */}
                <button
                  className={styles.removeIcon}
                  onClick={() => {
                    dispatch(removeFromWishlist(item.id));
                    syncWishlistWithDB("DELETE", `/${item.id}`); // DELETE /api/wishlist/:productId
                  }}
                  title="Remove from Wishlist"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}

          {/* Bottom Buttons */}
          <div className={styles.bottomButtons}>
            <button
              className={styles.continueBtn}
              onClick={() => router.push("/user/products")}
            >
              ← Continue Shopping
            </button>

            {/* ✅ UPDATED: uses handleClearWishlist for DB sync */}
            <div
              className={styles.clearCartContainer}
              onClick={handleClearWishlist}
            >
              <span className={styles.trashIcon}>🗑️</span> Clear Wishlist
            </div>
          </div>
        </div>
      </div>

      {/* MiniCart overlay */}
      <MiniCart
        visible={miniCartVisible}
        onClose={() => setMiniCartVisible(false)}
      />
    </div>
  );
}
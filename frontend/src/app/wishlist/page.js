"use client";
import styles from "../../styles/Wishlist.module.css";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeFromWishlist, clearWishlist } from "../../../redux/WishlistSlice";
import { addItemToCart } from "../../../redux/CartSlice";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import MiniCart from "../../../components/MiniCart"; // ✅ import your mini cart

export default function WishlistPage() {
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const [hasMounted, setHasMounted] = useState(false);
  const [miniCartVisible, setMiniCartVisible] = useState(false); // ✅ state to toggle mini cart
  const dispatch = useDispatch();
  const router = useRouter();

  useEffect(() => setHasMounted(true), []);
  if (!hasMounted) return null;

  if (wishlistItems.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <h2>Your wishlist is empty ❤️</h2>
      </div>
    );
  }

  const handleAddToCart = (item) => {
    dispatch(
      addItemToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
      })
    );

    // ✅ Show mini cart briefly (or toggle)
    setMiniCartVisible(true);
    setTimeout(() => setMiniCartVisible(false), 3000); // hide after 3s
  };

  return (
    <div className={styles.cartPageWrapper}>
      <div className={styles.cartPage}>
        {/* ===== Wishlist (Full Width) ===== */}
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

              {/* ✅ Add to Cart + Remove X side by side */}
              <div className={styles.actionsContainer}>
                <button
                  className={styles.addBtn}
                  onClick={() => handleAddToCart(item)}
                >
                  Add to Cart
                </button>
                <button
                  className={styles.removeIcon}
                  onClick={() => dispatch(removeFromWishlist(item.id))}
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
              onClick={() => router.push("/products")}
            >
              ← Continue Shopping
            </button>

            <div
              className={styles.clearCartContainer}
              onClick={() => dispatch(clearWishlist())}
            >
              <span className={styles.trashIcon}>🗑️</span> Clear Wishlist
            </div>
          </div>
        </div>
      </div>

      {/* ✅ MiniCart overlay */}
      <MiniCart
        visible={miniCartVisible}
        onClose={() => setMiniCartVisible(false)}
      />
    </div>
  );
}

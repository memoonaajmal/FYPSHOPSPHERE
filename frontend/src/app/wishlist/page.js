"use client";
import styles from "../../styles/Cart.module.css"; // reuse cart styles
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeFromWishlist, clearWishlist } from "../../../redux/WishlistSlice";
import { addItemToCart } from "../../../redux/CartSlice"; // ✅ import addItemToCart
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function WishlistPage() {
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const [hasMounted, setHasMounted] = useState(false);
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
    router.push("/cart"); 
  };

  return (
    <div className={styles.cartContainer}>
      <h1>Your Wishlist</h1>

      <div className={styles.cartItems}>
        {wishlistItems.map((item) => (
          <div key={item.id} className={styles.cartItem}>
            <Image src={item.image} alt={item.name} width={80} height={80} />
            <div className={styles.itemDetails}>
              <h3>{item.name}</h3>
              <p>PKR {item.price}</p>

              <div className={styles.actions}>
                <button
                  className={styles.removeBtn}
                  onClick={() => dispatch(removeFromWishlist(item.id))}
                >
                  Remove
                </button>

                <button
                  className={styles.checkoutBtn}
                  onClick={() => handleAddToCart(item)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.cartSummary}>
        <button
          className={styles.clearBtn}
          onClick={() => dispatch(clearWishlist())}
        >
          Clear Wishlist
        </button>
        <button
  className={styles.clearBtn}
  onClick={() => router.push("/products")}
>
  Continue Shopping
</button>
      </div>
    </div>
  );
}

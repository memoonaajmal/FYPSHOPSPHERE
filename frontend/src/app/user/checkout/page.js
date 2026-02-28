"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "../../../../firebase/config";
import { useSelector, useDispatch } from "react-redux";
import { clearCart } from "../../../../redux/CartSlice";
import { onAuthStateChanged } from "firebase/auth";
import styles from "../../../styles/Checkout.module.css";
import Recommendations from "../../../../components/Recommendations";

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const itemsTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0,
  );

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [discountedTotal, setDiscountedTotal] = useState(itemsTotal);
  const [trackingId, setTrackingId] = useState("");
  const [token, setToken] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    paymentMethod: "COD",
  });

  // -------------------------
  // Auth check
  // -------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/authentication/auth?redirect=/user/checkout");
      } else {
        setUser(u);

        const t = await u.getIdToken();
        setToken(t);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // -------------------------
  // JazzCash discount logic
  // -------------------------
  useEffect(() => {
    if (formData.paymentMethod === "JazzCash") {
      const discount = itemsTotal * 0.05;
      setDiscountedTotal(itemsTotal - discount);
    } else {
      setDiscountedTotal(itemsTotal);
    }
  }, [formData.paymentMethod, itemsTotal]);

  if (loading) return <p className={styles.text}>Loading...</p>;
  if (!user) return null;

  // -------------------------
  // Helpers
  // -------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const redirectToJazzCash = async (orderId, token) => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/jazzcash/prepare?orderId=${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "JazzCash prepare failed");
      }

      const { paymentUrl, paymentFields } = await res.json();

      // create POST form for JazzCash
      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentUrl;

      Object.entries(paymentFields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error("redirectToJazzCash error:", err);
      alert(err.message || "Failed to redirect to JazzCash");
    }
  };

  // -------------------------
  // Submit handler
  // -------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    try {
      setLoading(true);
      const token = await user.getIdToken();

      const items = cartItems.map((item) => ({
        productId: item.id,
        storeId: item.storeId,
        name: item.name,
        price: item.price,
        quantity: item.qty,
        image: item.image,
      }));

      const paymentMethod =
        formData.paymentMethod === "COD" ? "COD" : "JazzCash";

      // -------------------------
      // Create order
      // -------------------------
      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid, // send Firebase UID
          email: user.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          houseAddress: formData.address,
          items,
          itemsTotal:
            paymentMethod === "JazzCash" ? discountedTotal : itemsTotal,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Checkout failed");
        return;
      }

      // clear cart
      dispatch(clearCart());

      // -------------------------
      // JazzCash flow → redirect
      // -------------------------
      if (paymentMethod === "JazzCash") {
        await redirectToJazzCash(data._id || data.orderId, token); // <-- ensure orderId from backend
        return;
      }

      // COD flow → show success
      setTrackingId(data.trackingId);
    } catch (err) {
      console.error("checkout error:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Checkout</h1>

      {trackingId ? (
        <>
          {/* SUCCESS MESSAGE */}
          <div className={styles.successCard}>
            <h2 className={styles.subtitle}>Order Placed Successfully!</h2>
            <p className={styles.text}>
              Your tracking ID is:{" "}
              <strong className={styles.strong}>{trackingId}</strong>
            </p>
          </div>

          {/* RECOMMENDATION SECTION */}
          <div className={styles.recommendationSection}>
            <Recommendations token={token} />
          </div>

          <div style={{ marginTop: "30px" }}>
            <button className={styles.button} onClick={() => router.push("/")}>
              Continue Shopping
            </button>
          </div>
        </>
      ) : (
        <div className={styles.checkoutGrid}>
  {/* LEFT: FORM */}
  <form onSubmit={handleSubmit} className={styles.formWrapper}>
    <h2 className={styles.sectionTitle}>Shipping Details</h2>

    <input
      type="text"
      name="firstName"
      placeholder="First Name"
      required
      value={formData.firstName}
      onChange={handleChange}
      className={styles.input}
    />
    <input
      type="text"
      name="lastName"
      placeholder="Last Name"
      required
      value={formData.lastName}
      onChange={handleChange}
      className={styles.input}
    />
    <input
      type="text"
      name="phone"
      placeholder="Phone Number"
      required
      value={formData.phone}
      onChange={handleChange}
      className={styles.input}
    />
    <input
      type="email"
      value={user.email}
      readOnly
      className={`${styles.input} ${styles.readOnlyInput}`}
    />
    <textarea
      name="address"
      placeholder="House Address"
      required
      value={formData.address}
      onChange={handleChange}
      className={styles.textarea}
    />

    <div className={styles.paymentContainer}>
        <h3 className={styles.paymentTitle}>Payment method:</h3>

  <div className={styles.radioGroup}>
    <label
      className={`${styles.radioLabel} ${formData.paymentMethod === "COD" ? styles.active : ""}`}
    >
      <input
        type="radio"
        name="paymentMethod"
        value="COD"
        checked={formData.paymentMethod === "COD"}
        onChange={handleChange}
      />
<span className={styles.icon}>
  <img src="/images/cod.png" alt="Cash on Delivery" />
</span>      <span className={styles.text}>Cash on Delivery</span>
    </label>

    <label
      className={`${styles.radioLabel} ${formData.paymentMethod === "JazzCash" ? styles.active : ""}`}
    >
      <input
        type="radio"
        name="paymentMethod"
        value="JazzCash"
        checked={formData.paymentMethod === "JazzCash"}
        onChange={handleChange}
      />
<span className={styles.icon}>
  <img src="/images/jazzcash.png" alt="JazzCash" />
</span>      <span className={styles.text}>JazzCash (5% off)</span>
    </label>
  </div>

  <div className={styles.separator}></div>

  <div className={styles.infoBox}>
    {formData.paymentMethod === "COD" && (
      <p>No advance payment. Pay later in cash at your doorstep.</p>
    )}
    {formData.paymentMethod === "JazzCash" && (
      <p>Enjoy an instant 5% discount when you pay with JazzCash.</p>
    )}
  </div>
</div>

    <button type="submit" disabled={loading} className={styles.button}>
      {loading ? "Placing Order..." : "Place Order"}
    </button>
  </form>

  {/* RIGHT: CART SUMMARY */}
  <div className={styles.summaryCard}>
    <h2 className={styles.sectionTitle}>Order Summary</h2>

    {cartItems.map((item) => (
      <div key={item.id} className={styles.cartItem}>
        <img src={item.image} className={styles.cartImage} />
        <div className={styles.cartInfo}>
          <p className={styles.cartName}>{item.name}</p>
          <p className={styles.cartQty}>Qty: {item.qty}</p>
        </div>
        <p className={styles.cartPrice}>
          PKR {item.price * item.qty}
        </p>
      </div>
    ))}

    <div className={styles.summaryDivider}></div>

    <p className={styles.total}>
      Total:{" "}
      <strong>
        PKR{" "}
        {formData.paymentMethod === "JazzCash"
          ? discountedTotal
          : itemsTotal}
      </strong>
    </p>

    {formData.paymentMethod === "JazzCash" && (
      <p className={styles.discountNote}>5% discount applied</p>
    )}
  </div>
</div>
      )}
    </div>
  );
}

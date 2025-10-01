"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "../../../firebase/config";
import { useSelector, useDispatch } from "react-redux";
import { clearCart } from "../../../redux/CartSlice";
import { onAuthStateChanged } from "firebase/auth";
import styles from "../../styles/Checkout.module.css";

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const itemsTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [discountedTotal, setDiscountedTotal] = useState(itemsTotal);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    paymentMethod: "COD",
  });
  const [trackingId, setTrackingId] = useState("");

  // 🔐 Check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        router.push("/login?redirect=/checkout");
      } else {
        setUser(u);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [router]);

  // 🧠 Update discounted total dynamically
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    try {
      setLoading(true);
      const token = await user.getIdToken();

      // ✅ Include storeId when sending items
      const items = cartItems.map((item) => ({
        productId: item.id,         // product._id
        storeId: item.storeId,      // 🆕 must exist in cart slice now
        name: item.name,
        price: item.price,
        quantity: item.qty,
        image: item.image,
      }));

      const paymentMethod =
        formData.paymentMethod === "COD" ? "COD" : "JazzCash";

      const res = await fetch(`${BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          email: user.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          houseAddress: formData.address,
          items,
          itemsTotal:
            formData.paymentMethod === "JazzCash"
              ? discountedTotal
              : itemsTotal,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setTrackingId(data.trackingId);
        dispatch(clearCart());
      } else {
        alert(data.message || "Checkout failed");
      }
    } catch (err) {
      console.error("createOrder error:", err);
      alert("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Checkout</h1>
      {trackingId ? (
        <div>
          <div className={styles.successCard}>
            <h2 className={styles.subtitle}>✅ Order Placed Successfully!</h2>
            <p className={styles.text}>
              Your tracking ID is:{" "}
              <strong className={styles.strong}>{trackingId}</strong>
            </p>
          </div>
          <button className={styles.button} onClick={() => router.push("/")}>
            Continue Shopping
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={styles.formWrapper}>
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
            name="email"
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

          {/* 🔐 Payment Method */}
          <div>
            <p className={styles.label}>Payment:</p>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={formData.paymentMethod === "COD"}
                  onChange={handleChange}
                  className={styles.radioInput}
                />
                <span>Cash on Delivery</span>
              </label>

              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="JazzCash"
                  checked={formData.paymentMethod === "JazzCash"}
                  onChange={handleChange}
                  className={styles.radioInput}
                />
                <span>
                  JazzCash{" "}
                  <span className={styles.discountText}>(5% off)</span>
                </span>
              </label>
            </div>
          </div>

          <p className={styles.text}>
            Total:{" "}
            <strong className={styles.strong}>
              PKR{" "}
              {formData.paymentMethod === "JazzCash"
                ? discountedTotal
                : itemsTotal}
            </strong>
          </p>

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </form>
      )}
    </div>
  );
}

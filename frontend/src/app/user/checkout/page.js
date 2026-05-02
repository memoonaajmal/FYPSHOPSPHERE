"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "../../../../firebase/config";
import { useSelector, useDispatch } from "react-redux";
import { clearCart } from "../../../../redux/CartSlice";
import { onAuthStateChanged } from "firebase/auth";
import styles from "../../../styles/Checkout.module.css";
import successStyles from "../../../styles/SuccessCheckout.module.css";
import Recommendations from "../../../../components/Recommendations";

import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function StripePaymentForm({ clientSecret, onSuccess, onError, buttonClassName }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);

    const { error, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      }
    );

    setPaying(false);

    if (error) {
      onError(error.message);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess();
    }
  };

  return (
    <div style={{ marginTop: "1rem" }}>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "12px",
          background: "#fafafa",
          marginBottom: "12px",
        }}
      >
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#333",
                "::placeholder": { color: "#aaa" },
              },
              invalid: { color: "#e5424d" },
            },
          }}
        />
      </div>
      <button
        type="button"
        onClick={handlePay}
        disabled={paying || !stripe}
        className={buttonClassName}
      >
        {paying ? "Processing..." : "Pay with Card"}
      </button>
    </div>
  );
}

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
  const [trackingId, setTrackingId] = useState("");
  const [token, setToken] = useState(null);

  const [stripeClientSecret, setStripeClientSecret] = useState(null);
  const [stripeOrderId, setStripeOrderId] = useState(null);
  const [stripeTrackingId, setStripeTrackingId] = useState("");
  const [stripeError, setStripeError] = useState("");
  const [showStripePanel, setShowStripePanel] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    paymentMethod: "COD",
  });

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

  useEffect(() => {
    if (formData.paymentMethod === "JazzCash") {
      setDiscountedTotal(itemsTotal - itemsTotal * 0.05);
    } else {
      setDiscountedTotal(itemsTotal);
    }
    if (formData.paymentMethod !== "Stripe") {
      setShowStripePanel(false);
      setStripeClientSecret(null);
      setStripeOrderId(null);
      setStripeTrackingId("");
      setStripeError("");
    }
  }, [formData.paymentMethod, itemsTotal]);

  if (loading) return <p className={styles.text}>Loading...</p>;
  if (!user) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const computedTotal =
    formData.paymentMethod === "JazzCash" ? discountedTotal : itemsTotal;

  const clearDBCart = async (idToken) => {
    try {
      await fetch(`${BASE_URL}/api/cart`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
    } catch (err) {
      console.error("Failed to clear DB cart:", err);
    }
  };

  const redirectToJazzCash = async (orderId, idToken) => {
    try {
      const res = await fetch(
        `${BASE_URL}/api/jazzcash/prepare?orderId=${orderId}`,
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "JazzCash prepare failed");
      }
      const { paymentUrl, paymentFields } = await res.json();

      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentUrl;
      Object.entries(paymentFields).forEach(([key, val]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = val;
        form.appendChild(input);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error("redirectToJazzCash error:", err);
      alert(err.message || "Failed to redirect to JazzCash");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const idToken = await user.getIdToken();
    const items = cartItems.map((item) => ({
      productId: item.id,
      storeId: item.storeId,
      name: item.name,
      price: item.price,
      quantity: item.qty,
      image: item.image,
    }));

    if (formData.paymentMethod === "COD") {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/api/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            userId: user.uid,
            email: user.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            houseAddress: formData.address,
            items,
            itemsTotal,
            paymentMethod: "COD",
          }),
        });
        const data = await res.json();
        if (!res.ok) { alert(data.message || "Checkout failed"); return; }
        dispatch(clearCart());
        await clearDBCart(idToken);
        setTrackingId(data.trackingId);
      } catch (err) {
        console.error("checkout error:", err);
        alert("Something went wrong.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (formData.paymentMethod === "JazzCash") {
      try {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/api/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            userId: user.uid,
            email: user.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            houseAddress: formData.address,
            items,
            itemsTotal: discountedTotal,
            paymentMethod: "JazzCash",
          }),
        });
        const data = await res.json();
        if (!res.ok) { alert(data.message || "Checkout failed"); return; }
        dispatch(clearCart());
        await clearDBCart(idToken);
        await redirectToJazzCash(data._id || data.orderId, idToken);
      } catch (err) {
        console.error("checkout error:", err);
        alert("Something went wrong.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (formData.paymentMethod === "Stripe") {
      try {
        setLoading(true);
        setStripeError("");

        const stripeItems = cartItems.map((item) => ({
          productId: item.id,
          price: item.price,
          quantity: item.qty,
          image: item.image,
        }));

        const res = await fetch(`${BASE_URL}/api/stripe/create-payment-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            user: user.uid,
            email: user.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            houseAddress: formData.address,
            items: stripeItems,
            shippingFee: 0,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          alert(data.message || "Failed to initialise Stripe payment");
          return;
        }

        setStripeClientSecret(data.clientSecret);
        setStripeOrderId(data.orderId);
        setStripeTrackingId(data.trackingId || "");
        setShowStripePanel(true);
      } catch (err) {
        console.error("Stripe init error:", err);
        alert("Something went wrong starting Stripe payment.");
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  const handleStripeSuccess = async () => {
    try {
      const idToken = await user.getIdToken();
      dispatch(clearCart());
      await clearDBCart(idToken);
    } catch (err) {
      console.error("Failed to clear cart after Stripe payment:", err);
    } finally {
      setTrackingId(stripeTrackingId || "Confirmed");
      setShowStripePanel(false);
    }
  };

  const handleStripeError = (message) => {
    setStripeError(message);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Checkout</h1>

      {trackingId ? (
        <div className={successStyles.successCard}>
          <div className={successStyles.orderStatusSection}>
            <div className={successStyles.successIcon}>
              <img
                src="/images/orderconfirmation.png"
                alt="Order Confirmation"
                className={successStyles.successIconImage}
              />
            </div>
            <h2 className={successStyles.subtitle}>Order Placed Successfully!</h2>
            <p className={successStyles.text}>
              Your tracking ID is{" "}
              <strong className={successStyles.strong}>{trackingId}</strong>
            </p>

            <div className={successStyles.progressWrapper}>
              <div className={successStyles.progressBar}>
                {["Order Confirmed", "In Production", "Quality Check", "Shipped", "Delivered"].map(
                  (label, i) => (
                    <div key={label} className={successStyles.step}>
                      <div
                        className={`${successStyles.stepCircle} ${
                          i === 0 ? successStyles.completed : ""
                        }`}
                      >
                        {i === 0 ? "✓" : i + 1}
                      </div>
                      <div className={successStyles.stepLabel}>{label}</div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className={successStyles.continueButtonSection}>
              <button
                className={successStyles.button}
                onClick={() => router.push("/")}
              >
                Continue Shopping
              </button>
            </div>
          </div>

          <div className={successStyles.recommendationSectionWrapper}>
            <div className={successStyles.topProducts}>
              <h2>Your Next Pick</h2>
              <Recommendations token={token} variant="slider" />
            </div>
          </div>
        </div>
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
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={11}
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
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

            {/* Payment Method */}
            <div className={styles.paymentContainer}>
              <h3 className={styles.paymentTitle}>Payment method:</h3>

              <div className={styles.radioGroup}>
                {/* COD */}
                <label
                  className={`${styles.radioLabel} ${
                    formData.paymentMethod === "COD" ? styles.active : ""
                  }`}
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
                  </span>
                  <span className={styles.text}>Cash on Delivery</span>
                </label>

                {/* JazzCash */}
                <label
                  className={`${styles.radioLabel} ${
                    formData.paymentMethod === "JazzCash" ? styles.active : ""
                  }`}
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
                  </span>
                  <span className={styles.text}>JazzCash (5% off)</span>
                </label>

                {/* Stripe */}
                <label
                  className={`${styles.radioLabel} ${
                    formData.paymentMethod === "Stripe" ? styles.active : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Stripe"
                    checked={formData.paymentMethod === "Stripe"}
                    onChange={handleChange}
                  />
                  <span className={styles.icon}>
                    <img src="/images/stripe.svg" alt="Stripe" />
                  </span>
                  <span className={styles.text}>Credit / Debit Card</span>
                </label>
              </div>
            </div>

            {/* Place Order / Continue to Payment button */}
            {!showStripePanel && (
              <button
                type="submit"
                disabled={loading}
                className={styles.button}
              >
                {loading
                  ? "Please wait..."
                  : formData.paymentMethod === "Stripe"
                  ? "Continue to Payment"
                  : "Place Order"}
              </button>
            )}

            {/* Stripe card panel */}
            {showStripePanel && stripeClientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                <StripePaymentForm
                  clientSecret={stripeClientSecret}
                  onSuccess={handleStripeSuccess}
                  onError={handleStripeError}
                  buttonClassName={styles.button}
                />
              </Elements>
            )}

            {stripeError && (
              <p style={{ color: "red", marginTop: "8px", fontSize: "14px" }}>
                {stripeError}
              </p>
            )}
          </form>

          {/* RIGHT: CART SUMMARY */}
          <div className={styles.summaryCard}>
            <h2 className={styles.sectionTitle}>Order Summary</h2>

            {cartItems.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <img src={item.image} className={styles.cartImage} alt={item.name} />
                <div className={styles.cartInfo}>
                  <p className={styles.cartName}>{item.name}</p>
                  <p className={styles.cartQty}>Qty: {item.qty}</p>
                </div>
                <p className={styles.cartPrice}>PKR {item.price * item.qty}</p>
              </div>
            ))}

            <div className={styles.summaryDivider}></div>

            <p className={styles.total}>
              Total:{" "}
              <strong>
                PKR {formData.paymentMethod === "JazzCash" ? discountedTotal : itemsTotal}
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
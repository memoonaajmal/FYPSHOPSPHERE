"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import styles from "../styles/CreateStoreRequest.module.css";
import fStyles from "../styles/Storerequestform.module.css";
import {
  Rocket,
  Package,
  TrendingUp,
  ShieldCheck,
  Store,
  Hourglass,
  XCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function CreateStoreRequest() {
  const { user } = useAuth();
  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const [existingRequest, setExistingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [formVisible, setFormVisible] = useState(false);

  const [formData, setFormData] = useState({
    storeName: "",
    description: "",
    category: "Fashion",
    email: "",
    phoneNumber: "",
    businessName: "",
    ownerFullName: "",
    streetAddress: "",
    city: "",
    state: "",
    postalCode: "",
    cnicNumber: "",
  });

  const [files, setFiles] = useState({
    cnicImage: null,
    logo: null,
    banner: null,
  });

  useEffect(() => {
    if (!user || !user._id) return;
    console.log("Current user from context:", user);

    const fetchExistingRequest = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/stores/my-request?sellerId=${user._id}`,
        );
        if (res.status === 404) {
          setExistingRequest(null);
        } else if (res.ok) {
          const data = await res.json();
          setExistingRequest(data);

          if (data.status === "approved") {
            router.push("/seller/dashboard");
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExistingRequest();
  }, [user, router, BASE_URL]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e) =>
    setFiles({ ...files, [e.target.name]: e.target.files[0] });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !user._id) {
      setMessage({
        type: "error",
        text: "User session expired. Please login again.",
      });
      return;
    }

    console.log(" User object:", user);
    console.log(" Sending sellerId:", user._id);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    if (files.cnicImage) data.append("cnicImage", files.cnicImage);
    if (files.logo) data.append("logo", files.logo);
    if (files.banner) data.append("banner", files.banner);
    data.append("sellerId", user._id);

    console.log(" FormData being sent:");
    for (let pair of data.entries()) {
      console.log("  ", pair[0], ":", pair[1]);
    }

    try {
      const res = await fetch(`${BASE_URL}/api/stores/create-request`, {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      console.log("📨 Backend response:", result);

      if (!res.ok) {
        throw new Error(
          ` Backend error (${res.status}): ${result.message || "Unknown error"}`,
        );
      }

      setMessage({
        type: "success",
        text: "Your store request has been sent successfully. Waiting for admin approval.",
      });
      setExistingRequest(result.request);
      setFormVisible(false);
    } catch (err) {
      console.error(" Error submitting store request:", err);
      setMessage({ type: "error", text: err.message });
    }
  };

  if (loading)
    return (
      <p style={{ padding: "20px", textAlign: "center", color: "#fff" }}>
        Loading...
      </p>
    );

  // ── Status card (pending / rejected) ──
  if (existingRequest) {
    if (existingRequest.status === "approved") return null;

    const isPending = existingRequest.status === "pending";

    return (
      <div className={styles.landingContainer}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.blob3} />

        <div className={styles.statusCard}>
          <div
            className={
              isPending ? styles.statusIconPending : styles.statusIconRejected
            }
          >
{isPending ? <Hourglass size={32} color="white" /> : <XCircle size={32} color="white" />}          </div>

          <h1 className={styles.statusTitle}>Your Store Request</h1>

          <div className={styles.statusInfoRow}>
            <span className={styles.statusInfoLabel}>Store Name</span>
            <span className={styles.statusInfoValue}>
              {existingRequest.storeName}
            </span>
          </div>

          <div className={styles.statusInfoRow}>
            <span className={styles.statusInfoLabel}>Status</span>
            <span
              className={isPending ? styles.badgePending : styles.badgeRejected}
            >
              {existingRequest.status}
            </span>
          </div>

          <p className={styles.statusMessage}>
            {isPending
              ? "Your request is currently under review. We'll notify you once it's approved."
              : "Unfortunately your store request was rejected. You can submit a new request below."}
          </p>

          {existingRequest.status === "rejected" && !formVisible && (
            <button
              className={styles.heroButton}
              style={{ marginTop: "1.5rem" }}
              onClick={() => {
                setFormVisible(true);
                setExistingRequest(null);
              }}
            >
              <span
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Store size={20} />
                Create Store Again
              </span>
              <svg
                className={styles.arrowIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Landing hero (before form) ──
  if (!formVisible) {
    return (
      <div className={styles.landingContainer}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.blob3} />

        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>ShopSphere Seller Program</p>
          <h1 className={styles.heroTitle}>
            Your Store.
            <br />
            Your Empire.
          </h1>
          <p className={styles.heroSubtitle}>
            Join thousands of sellers who turned their passion into profit. Set
            up your storefront, reach real buyers, and grow a brand that lasts —
            all in one place.
          </p>

          <button
            className={styles.heroButton}
            onClick={() => setFormVisible(true)}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Store size={20} />
              Create Your Store
            </span>
            <svg
              className={styles.arrowIcon}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>
              <Rocket size={28} />
            </span>
            <h3>Launch Fast</h3>
            <p>Go live in minutes. Your store, your branding, zero hassle.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>
              <Package size={28} />
            </span>
            <h3>Sell Anything</h3>
            <p>Fashion, electronics, groceries — any category, any scale.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>
              <TrendingUp size={28} />
            </span>
            <h3>Grow Effortlessly</h3>
            <p>Powerful analytics and tools to scale your business daily.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>
              <ShieldCheck size={28} />
            </span>
            <h3>Secure & Trusted</h3>
            <p>Verified sellers, secure payments, and buyer trust built in.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className={fStyles.container}>
      <h1 className={fStyles.title}>Create Store Request</h1>
      {message && (
        <p
          className={`${fStyles.message} ${message.type === "success" ? fStyles.messageSuccess : fStyles.messageError}`}
        >
          {message.type === "success" ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {message.text}
        </p>
      )}
      <h3 className={fStyles.formIntro}>
        Take the first step with SHOPSPHERE and let us help you build your dream
        store, connect with buyers, and grow your brand effortlessly
      </h3>

      <form
        className={fStyles.form}
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        {/* Left Column */}
        <div className={fStyles.leftColumn}>
          <h3>Basic Store Info</h3>
          <input
            className={fStyles.formInput}
            type="text"
            name="storeName"
            placeholder="Store Name"
            required
            onChange={handleChange}
          />
          <textarea
            className={fStyles.formTextarea}
            name="description"
            placeholder="Description"
            onChange={handleChange}
          />
          <select
            className={fStyles.formSelect}
            name="category"
            onChange={handleChange}
            value={formData.category}
          >
            <option value="Fashion">Fashion</option>
            <option value="Clothing">Clothing</option>
            <option value="Beauty & Health">Beauty & Health</option>
            <option value="Home & Living">Home & Living</option>
            <option value="Sports">Sports</option>
            <option value="Electronics">Electronics</option>
            <option value="Grocery">Grocery</option>
            <option value="Other">Other</option>
          </select>

          <h3>Contact Info</h3>
          <input
            className={fStyles.formInput}
            type="email"
            name="email"
            placeholder="Email"
            required
            onChange={handleChange}
          />
          <input
            className={fStyles.formInput}
            type="text"
            name="phoneNumber"
            placeholder="Phone Number"
            required
            onChange={handleChange}
          />

          <h3>Verification / Identification</h3>
          <input
            className={fStyles.formInput}
            type="text"
            name="cnicNumber"
            placeholder="CNIC Number"
            onChange={handleChange}
          />
          <input
            className={fStyles.formInput}
            type="file"
            name="cnicImage"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {/* Right Column */}
        <div className={fStyles.rightColumn}>
          <h3>Business Info</h3>
          <input
            className={fStyles.formInput}
            type="text"
            name="businessName"
            placeholder="Business Name"
            required
            onChange={handleChange}
          />
          <input
            className={fStyles.formInput}
            type="text"
            name="ownerFullName"
            placeholder="Owner Full Name"
            required
            onChange={handleChange}
          />

          <h3>Address</h3>
          <input
            className={fStyles.formInput}
            type="text"
            name="streetAddress"
            placeholder="Street Address"
            required
            onChange={handleChange}
          />
          <input
            className={fStyles.formInput}
            type="text"
            name="city"
            placeholder="City"
            required
            onChange={handleChange}
          />
          <input
            className={fStyles.formInput}
            type="text"
            name="state"
            placeholder="State"
            required
            onChange={handleChange}
          />
          <input
            className={fStyles.formInput}
            type="text"
            name="postalCode"
            placeholder="Postal Code"
            required
            onChange={handleChange}
          />

          <h3>Branding (optional)</h3>
          <input
            className={fStyles.formInput}
            type="file"
            name="logo"
            accept="image/*"
            onChange={handleFileChange}
          />
          <input
            className={fStyles.formInput}
            type="file"
            name="banner"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        {/* Submit Button */}
        <div className={fStyles.buttonContainer}>
          <button className={fStyles.button} type="submit">
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}

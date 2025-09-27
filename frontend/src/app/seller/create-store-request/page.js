"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import styles from "../styles/CreateStoreRequest.module.css";

export default function CreateStoreRequest() {
  const { user } = useAuth();
  const router = useRouter();
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

  const [existingRequest, setExistingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [formVisible, setFormVisible] = useState(false); // ✅ toggle form

  const [formData, setFormData] = useState({
    storeName: "",
    description: "",
    category: "Electronics",
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

    const fetchExistingRequest = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/stores/my-request?sellerId=${user._id}`
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
    if (!user || !user._id) return;

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => data.append(key, value));
    if (files.cnicImage) data.append("cnicImage", files.cnicImage);
    if (files.logo) data.append("logo", files.logo);
    if (files.banner) data.append("banner", files.banner);
    data.append("sellerId", user._id);

    try {
      const res = await fetch(`${BASE_URL}/api/stores/create-request`, {
        method: "POST",
        body: data,
      });
      const result = await res.json();
      if (!res.ok)
        throw new Error(result.message || "Failed to submit request");
      setMessage(
        "✅ Your store request has been sent successfully. Waiting for admin approval."
      );
      setExistingRequest(result.request);
    } catch (err) {
      console.error(err);
      setMessage(err.message);
    }
  };

  if (loading)
    return <p style={{ padding: "20px", textAlign: "center" }}>Loading...</p>;

  if (existingRequest) {
    if (existingRequest.status === "approved") return null;

    const statusMessage =
      existingRequest.status === "pending"
        ? "⏳ Your request is under review."
        : "❌ Your store request was rejected.";

    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Your Store Request</h1>
        <p>
          <strong>Store Name:</strong> {existingRequest.storeName}
        </p>
        <p>
          <strong>Status:</strong> {existingRequest.status}
        </p>
        <p>{statusMessage}</p>

        {/* ✅ Show "Create Again" button if rejected */}
        {existingRequest.status === "rejected" && !formVisible && (
          <button
            className={styles.button}
            style={{ marginTop: "20px" }}
            onClick={() => {
              setFormVisible(true); // show the form
              setExistingRequest(null); // hide the rejected request
            }}
          >
            🏬 Create Store Again
          </button>
        )}
      </div>
    );
  }

  // ✅ Show "Create Store" button first
  if (!formVisible) {
    return (
      <div
        className={styles.container}
        style={{ textAlign: "center", padding: "50px" }}
      >
        <button className={styles.button} onClick={() => setFormVisible(true)}>
          🏬 Create Your Store
        </button>
      </div>
    );
  }

  // Form
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Create Store Request</h1>
      {message && <p className={styles.message}>{message}</p>}

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        {/* Basic Store Info */}
        <h3>Basic Store Info</h3>
        <input
          className={styles.formInput}
          type="text"
          name="storeName"
          placeholder="Store Name"
          required
          onChange={handleChange}
        />
        <textarea
          className={styles.formTextarea}
          name="description"
          placeholder="Description"
          onChange={handleChange}
        />
        <select
          className={styles.formSelect}
          name="category"
          onChange={handleChange}
          value={formData.category}
        >
          <option value="Electronics">Electronics</option>
          <option value="Clothing">Clothing</option>
          <option value="Grocery">Grocery</option>
          <option value="Other">Other</option>
        </select>

        {/* Contact Info */}
        <h3>Contact Info</h3>
        <input
          className={styles.formInput}
          type="email"
          name="email"
          placeholder="Email"
          required
          onChange={handleChange}
        />
        <input
          className={styles.formInput}
          type="text"
          name="phoneNumber"
          placeholder="Phone Number"
          required
          onChange={handleChange}
        />

        {/* Business Info */}
        <h3>Business Info</h3>
        <input
          className={styles.formInput}
          type="text"
          name="businessName"
          placeholder="Business Name"
          required
          onChange={handleChange}
        />
        <input
          className={styles.formInput}
          type="text"
          name="ownerFullName"
          placeholder="Owner Full Name"
          required
          onChange={handleChange}
        />

        {/* Address */}
        <h3>Address</h3>
        <input
          className={styles.formInput}
          type="text"
          name="streetAddress"
          placeholder="Street Address"
          required
          onChange={handleChange}
        />
        <input
          className={styles.formInput}
          type="text"
          name="city"
          placeholder="City"
          required
          onChange={handleChange}
        />
        <input
          className={styles.formInput}
          type="text"
          name="state"
          placeholder="State"
          required
          onChange={handleChange}
        />
        <input
          className={styles.formInput}
          type="text"
          name="postalCode"
          placeholder="Postal Code"
          required
          onChange={handleChange}
        />

        {/* Verification / Identification */}
        <h3>Verification / Identification</h3>
        <input
          className={styles.formInput}
          type="text"
          name="cnicNumber"
          placeholder="CNIC Number"
          onChange={handleChange}
        />
        <input
          className={styles.formInput}
          type="file"
          name="cnicImage"
          accept="image/*"
          onChange={handleFileChange}
        />

        {/* Branding */}
        <h3>Branding (optional)</h3>
        <input
          className={styles.formInput}
          type="file"
          name="logo"
          accept="image/*"
          onChange={handleFileChange}
        />
        <input
          className={styles.formInput}
          type="file"
          name="banner"
          accept="image/*"
          onChange={handleFileChange}
        />

        <div style={{ marginTop: "20px" }}>
          <button className={styles.button} type="submit">
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}

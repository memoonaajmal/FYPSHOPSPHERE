"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth } from "../../../../../../firebase/config";
import { BASE_URL } from "../../page"; // adjust if needed
import styles from "../../../styles/AddProductPage.module.css";

export default function UpdateProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;

  const [form, setForm] = useState({
    productDisplayName: "",
    gender: "Unisex",
    masterCategory: "",
    subCategory: "",
    articleType: "",
    baseColour: "",
    season: "",
    year: new Date().getFullYear(),
    usage: "",
    imageFilename: "",
    price: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState(null); // preview new upload
  const [newImageFile, setNewImageFile] = useState(null); // store file if chosen

  // ✅ Fetch product details
  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const user = auth.currentUser;
        if (!user) throw new Error("Not logged in");

        const token = await user.getIdToken();
        const res = await fetch(`${BASE_URL}/api/seller/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(await res.text());
        const products = await res.json();
        const product = products.find((p) => p.productId === productId);

        if (!product) throw new Error("Product not found");

        setForm({
          productDisplayName: product.productDisplayName || "",
          gender: product.gender || "Unisex",
          masterCategory: product.masterCategory || "",
          subCategory: product.subCategory || "",
          articleType: product.articleType || "",
          baseColour: product.baseColour || "",
          season: product.season || "",
          year: product.year || new Date().getFullYear(),
          usage: product.usage || "",
          imageFilename: product.imageFilename || "",
          price: product.price ?? 0,
        });
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ✅ Upload image if selected
  const uploadImageIfNeeded = async () => {
    if (!newImageFile) return form.imageFilename; // keep existing one

    const user = auth.currentUser;
    if (!user) throw new Error("Not logged in");
    const token = await user.getIdToken();

    const data = new FormData();
    data.append("image", newImageFile);

    const res = await fetch(`${BASE_URL}/api/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: data,
    });

    if (!res.ok) throw new Error(await res.text());
    const result = await res.json();
    return result.filename;
  };

  // ✅ Submit update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const token = await user.getIdToken();

      // Upload image if new one is selected
      const imageFilename = await uploadImageIfNeeded();

      const updatedData = { ...form, imageFilename };

      const res = await fetch(`${BASE_URL}/api/seller/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error(await res.text());
      router.push("/seller/products");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading product...</p>;

  const currentImageUrl = form.imageFilename
    ? `${BASE_URL.replace(/\/$/, "")}/images/${form.imageFilename}`
    : null;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Update Product</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.formLabel}>
          Product Name:
          <input
            className={styles.formInput}
            name="productDisplayName"
            value={form.productDisplayName}
            onChange={handleChange}
            required
          />
        </label>

        <label className={styles.formLabel}>
          Gender:
          <select
            className={styles.formSelect}
            name="gender"
            value={form.gender}
            onChange={handleChange}
          >
            <option>Men</option>
            <option>Women</option>
            <option>Unisex</option>
          </select>
        </label>

        <label className={styles.formLabel}>
          Master Category:
          <input
            className={styles.formInput}
            name="masterCategory"
            value={form.masterCategory}
            onChange={handleChange}
            required
          />
        </label>

        <label className={styles.formLabel}>
          Sub Category:
          <input
            className={styles.formInput}
            name="subCategory"
            value={form.subCategory}
            onChange={handleChange}
          />
        </label>

        <label className={styles.formLabel}>
          Article Type:
          <input
            className={styles.formInput}
            name="articleType"
            value={form.articleType}
            onChange={handleChange}
          />
        </label>

        <label className={styles.formLabel}>
          Base Colour:
          <input
            className={styles.formInput}
            name="baseColour"
            value={form.baseColour}
            onChange={handleChange}
          />
        </label>

        <label className={styles.formLabel}>
          Season:
          <input
            className={styles.formInput}
            name="season"
            value={form.season}
            onChange={handleChange}
          />
        </label>

        <label className={styles.formLabel}>
          Year:
          <input
            className={styles.formInput}
            type="number"
            name="year"
            value={form.year}
            onChange={handleChange}
          />
        </label>

        <label className={styles.formLabel}>
          Usage:
          <input
            className={styles.formInput}
            name="usage"
            value={form.usage}
            onChange={handleChange}
          />
        </label>

        {/* ✅ Image Upload Section */}
        <div className={styles.formLabel}>
          <p>Current Image:</p>
          {currentImageUrl && !imagePreview && (
            <img
              src={currentImageUrl}
              alt="Current Product"
              style={{ width: "150px", marginBottom: "10px" }}
            />
          )}
          {imagePreview && (
            <img
              src={imagePreview}
              alt="New Preview"
              style={{ width: "150px", marginBottom: "10px" }}
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className={styles.formInput}
          />
        </div>

        <label className={styles.formLabel}>
          Price:
          <input
            className={styles.formInput}
            type="number"
            name="price"
            value={form.price}
            onChange={handleChange}
          />
        </label>

        <button className={styles.formButton} type="submit" disabled={saving}>
          {saving ? "Updating..." : "Update Product"}
        </button>
      </form>
    </div>
  );
}

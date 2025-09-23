"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../../../../firebase/config";
import { BASE_URL } from "../page"; // same as your SellerProductsPage
import styles from "../../../../styles/AddProductPage.module.css";

export default function AddProductPage() {
  const router = useRouter();
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");

      const token = await user.getIdToken();

      const res = await fetch(`${BASE_URL}/api/seller/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      router.push("/seller/products");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Add New Product</h1>
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

        <label className={styles.formLabel}>
          Image Filename (optional):
          <input
            className={styles.formInput}
            name="imageFilename"
            value={form.imageFilename}
            onChange={handleChange}
          />
        </label>

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

        <button className={styles.formButton} type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}

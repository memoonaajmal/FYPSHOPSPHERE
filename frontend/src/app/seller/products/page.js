'use client';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth } from "../../../../firebase/config";
import SellerProductCard from "../../../../components/SellerProductCard";
import Pagination from "../../../../components/Pagination";
import styles from "../../../styles/SellerProductPage.module.css";

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function SellerProductsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Sync page state with URL query
  useEffect(() => {
    const urlPage = parseInt(params.get("page")) || 1;
    setPage(urlPage);
  }, [params]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const user = auth.currentUser;
      if (!user) {
        setError("Not logged in");
        setProducts([]);
        setTotalPages(1);
        return;
      }

      const token = await user.getIdToken();

      const res = await fetch(`${BASE_URL}/api/seller/products?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

      const data = await res.json();

      if (data.data && Array.isArray(data.data)) {
        setProducts(data.data);
        setTotalPages(data.totalPages || 1);
      } else {
        setProducts(Array.isArray(data) ? data : []);
        setTotalPages(1);
      }

      setError("");
    } catch (err) {
      console.error("❌ Fetch products error:", err);
      setError(err.message);
      setProducts([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const handleDelete = async (productId) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Not logged in");
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch(`${BASE_URL}/api/seller/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Failed to delete product: ${await res.text()}`);

      setProducts((prev) => prev.filter((p) => (p.productId || p._id) !== productId));
    } catch (err) {
      console.error("❌ Delete product error:", err);
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      {/* Header: Title + Add Product button */}
      <div className={styles.header}>
        <h1 className={styles.title}>My Products</h1>
        <button
          className={styles.addProductBtn}
          onClick={() => router.push("/seller/products/add")}
        >
          + Add New Product
        </button>
      </div>

      {loading && <p>Loading your products...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      <div className={styles.productsGrid}>
        {!loading && products.length > 0 ? (
          products.map((product) => (
            <SellerProductCard
              key={product.productId || product._id}
              product={product}
              onDelete={handleDelete}
            />
          ))
        ) : (
          !loading && <p className={styles.noProducts}>No products found.</p>
        )}
      </div>

      {/* Pagination */}
      {!loading && products.length > 0 && totalPages > 1 && (
        <div className={styles.paginationWrapper}>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

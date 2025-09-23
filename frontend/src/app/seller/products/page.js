"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../../../firebase/config";

import SellerProductCard from "../../../../components/SellerProductCard";
import SearchFilterBar from "../../../../components/FilterBar";
import StorePagination from "../../../../components/StorePagination";

import styles from "../../../styles/SellerProductPage.module.css"; // ✅ using admin style

export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function SellerProductsPage() {
  const router = useRouter();

  // State
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Fetch seller’s products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const user = auth.currentUser;
        if (!user) {
          setError("Not logged in");
          setProducts([]);
          setFilteredProducts([]);
          return;
        }

        const token = await user.getIdToken();
        const res = await fetch(`${BASE_URL}/api/seller/products`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

        const data = await res.json();

        if (data.data && Array.isArray(data.data)) {
          setProducts(data.data);
          setFilteredProducts(data.data);
        } else {
          setProducts(Array.isArray(data) ? data : []);
          setFilteredProducts(Array.isArray(data) ? data : []);
        }

        setError("");
      } catch (err) {
        console.error("❌ Fetch products error:", err);
        setError(err.message);
        setProducts([]);
        setFilteredProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Delete product (confirmation removed here)
  const handleDeleteProduct = async (productId) => {
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

      setProducts((prev) =>
        prev.filter((p) => (p.productId || p._id) !== productId)
      );
      setFilteredProducts((prev) =>
        prev.filter((p) => (p.productId || p._id) !== productId)
      );
    } catch (err) {
      console.error("❌ Delete product error:", err);
      setError(err.message);
    }
  };

  // Handle filters
  const handleFilterChange = (filters) => {
    let filtered = [...products];

    if (filters.search)
      filtered = filtered.filter((p) =>
        p.productDisplayName
          ?.toLowerCase()
          .includes(filters.search.toLowerCase())
      );
    if (filters.gender)
      filtered = filtered.filter((p) => p.gender === filters.gender);
    if (filters.baseColour)
      filtered = filtered.filter((p) => p.baseColour === filters.baseColour);
    if (filters.season)
      filtered = filtered.filter((p) => p.season === filters.season);
    if (filters.category)
      filtered = filtered.filter((p) => p.category === filters.category);

    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  if (loading) return <p>Loading your products...</p>;

  return (
    <div className={styles.container}>
      {/* Hero Banner (like Admin style) */}
      <section className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1 className={styles.storeTitle}>My Products</h1>
          <p className={styles.storeSubtitle}>
            Manage, filter, and add your products easily.
          </p>
          <button
            className={styles.addProductBtn}
            onClick={() => router.push("/seller/products/add")}
          >
            + Add New Product
          </button>
        </div>
      </section>

      {/* Store Content */}
      <div className={styles.storeContent}>
        {/* Filter Bar */}
        <SearchFilterBar onFilterChange={handleFilterChange} />

        {/* Products Section */}
        <section className={styles.productsSection}>
          <h2 className={styles.productsHeading}>Products</h2>
          <div className={styles.productsGrid}>
            {currentProducts.length > 0 ? (
              currentProducts.map((product) => (
                <SellerProductCard
                  key={product.productId || product._id}
                  product={product}
                  onDelete={handleDeleteProduct}
                />
              ))
            ) : (
              <p className={styles.emptyState}>No products found.</p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <StorePagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </section>
      </div>
    </div>
  );
}

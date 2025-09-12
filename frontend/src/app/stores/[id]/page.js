"use client";
import styles from "../../../styles/store.module.css";
import { use, useEffect, useState } from "react";
import ProductCard from "../../../../components/ProductCard";
import SearchFilterBar from "../../../../components/FilterBar";
import StorePagination from "../../../../components/StorePagination";
import { Store } from "lucide-react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function StorePage({ params }) {
  const { id } = use(params); // unwrap Promise

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12; // Adjust as needed

  // Fetch store and products
  useEffect(() => {
    if (!id) return;

    fetch(`${BASE_URL}/api/stores/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setStore(data?.store || null);
        setProducts(data?.products || []);
        setFilteredProducts(data?.products || []);
        setCurrentPage(1); // Reset page when store changes
      })
      .catch((err) => console.error("Error fetching store:", err));
  }, [id]);

  // Handle filters
  const handleFilterChange = (filters) => {
    let filtered = [...products];

    if (filters.search)
      filtered = filtered.filter((p) =>
        p.productDisplayName.toLowerCase().includes(filters.search.toLowerCase())
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
    setCurrentPage(1); // Reset page when filters change
  };

  if (!store) return <p>Loading store...</p>;

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div className={styles.container}>
      {/* Hero Banner */}
      <section className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1 className={styles.storeTitle}>{store?.name || "Unnamed Store"}</h1>
          <p className={styles.storeSubtitle}>
            {Array.isArray(store?.categories) && store.categories.length > 0
              ? `Shop by categories: ${store.categories.join(", ")}`
              : "Discover our wide collection of products!"}
          </p>
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
              currentProducts.map((p) => (
                <ProductCard key={p.productId || p._id} product={p} />
              ))
            ) : (
              <p className={styles.emptyState}>No products match your filters.</p>
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

"use client";
import styles from "../../../styles/store.module.css";
import { use, useEffect, useState, useRef } from "react";
import ProductCard from "../../../../components/ProductCard";
import SearchFilterBar from "../../../../components/FilterBar";
import StorePagination from "../../../../components/StorePagination";
import { gsap } from "gsap";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export default function StorePage({ params }) {
  // ✅ unwrap params synchronously (no async hook issues)
  const { id } = use(params);

  // State
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Refs
  const heroRef = useRef(null);
  const productsRef = useRef(null);

  // ✅ Fetch store and products
  useEffect(() => {
    if (!id) return;

    fetch(`${BASE_URL}/api/stores/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setStore(data?.store || null);
        setProducts(data?.products || []);
        setFilteredProducts(data?.products || []);
        setCurrentPage(1);
      })
      .catch((err) => console.error("Error fetching store:", err));
  }, [id]);

  // ✅ Filter logic
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
    setCurrentPage(1);
  };

  // ✅ GSAP animations
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: -50 },
        { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
      );
    }
  }, [store]);

  useEffect(() => {
    if (productsRef.current) {
      const cards = productsRef.current.querySelectorAll(".product-card");

      gsap.fromTo(
        cards,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.1,
        }
      );
    }
  }, [filteredProducts, currentPage]);

  // ✅ After all hooks, conditionally render
  if (!store) return <p>Loading store...</p>;

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div className={styles.container}>
      {/* 🌟 Hero Banner */}
      <section ref={heroRef} className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1 className={styles.storeTitle}>{store?.name || "Unnamed Store"}</h1>
          <p className={styles.storeSubtitle}>
            {Array.isArray(store?.categories) && store.categories.length > 0
              ? `Shop by categories: ${store.categories.join(", ")}`
              : "Discover our wide collection of products!"}
          </p>
        </div>
      </section>

      {/* 🛍 Store Content */}
      <div className={styles.storeContent}>
        <SearchFilterBar onFilterChange={handleFilterChange} />

        <section className={styles.productsSection}>
          <h2 className={styles.productsHeading}>Products</h2>
          <div ref={productsRef} className={styles.productsGrid}>
            {currentProducts.length > 0 ? (
              currentProducts.map((p) => (
                <div key={p.productId || p._id} className="product-card">
                  <ProductCard product={p} />
                </div>
              ))
            ) : (
              <p className={styles.emptyState}>No products match your filters.</p>
            )}
          </div>

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

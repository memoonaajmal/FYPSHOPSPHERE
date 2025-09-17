"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles/SearchFilterBar.module.css";

export default function SearchFilterBar({ onFilterChange }) {
  const [filters, setFilters] = useState({
    search: "",
    gender: "",
    baseColour: "",
    season: "",
    category: "",
    priceMin: "",
    priceMax: "",
  });

  const [searchInput, setSearchInput] = useState(""); // local input for search
  const router = useRouter();

  // 🔹 Push filters to router + parent
  const updateFilters = useCallback(
    (updated) => {
      setFilters(updated);
      if (onFilterChange) onFilterChange(updated);

      const query = new URLSearchParams(
        Object.fromEntries(
          Object.entries(updated).filter(([_, v]) => v !== "")
        )
      ).toString();

      router.push(`?${query}`, { shallow: true });
    },
    [onFilterChange, router]
  );

  // 🔹 General filter change
  const handleChange = (name, value) => {
    updateFilters({ ...filters, [name]: value });
  };

  // 🔹 Remove filter
  const handleRemoveFilter = (e, name) => {
    e.stopPropagation();
    updateFilters({ ...filters, [name]: "" });
    if (name === "search") setSearchInput("");
  };

  // 🔹 Trigger search manually
  const handleSearch = () => {
    updateFilters({ ...filters, search: searchInput });
  };

  // 🔹 Handle Enter press in search input
  const handleSearchKey = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  // 🔹 Render radio options with deselect
  const renderRadioOption = (name, value) => (
    <div key={`${name}-${value}`} className={styles.radioWrapper}>
      <label className={styles.radioLabel}>
        <input
          type="radio"
          name={name}
          value={value}
          checked={filters[name] === value}
          onChange={() => handleChange(name, value)}
        />
        {value}
      </label>
      {filters[name] === value && (
        <span
          className={styles.deselectBtn}
          onClick={(e) => handleRemoveFilter(e, name)}
        >
          ×
        </span>
      )}
    </div>
  );

  return (
    <div className={styles.filterWrapper}>
      {/* 🔹 Search */}
      <div className={styles.searchBox}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKey}
        />
        <button onClick={handleSearch}>Search</button>
        {filters.search && (
          <button
            className={styles.clearBtn}
            onClick={(e) => handleRemoveFilter(e, "search")}
          >
            ×
          </button>
        )}
      </div>

      {/* 🔹 Price Range */}
      <div className={styles.priceFilter}>
        <h3>Price</h3>
        <div className={styles.priceInputs}>
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => handleChange("priceMin", e.target.value)}
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => handleChange("priceMax", e.target.value)}
          />
        </div>
      </div>

      {/* 🔹 Sidebar Filters */}
      <aside className={styles.sidebar}>
        <h3 className="mt-4">Gender</h3>
        {["Men", "Women"].map((g) => renderRadioOption("gender", g))}

        <h3 className="mt-4">Color</h3>
        {["Black", "White", "Blue", "Red"].map((c) =>
          renderRadioOption("baseColour", c)
        )}

        <h3 className="mt-4">Season</h3>
        {["Summer", "Fall", "Winter", "Spring"].map((s) =>
          renderRadioOption("season", s)
        )}
      </aside>
    </div>
  );
}

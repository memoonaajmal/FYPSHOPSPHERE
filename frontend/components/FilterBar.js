"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles/SearchFilterBar.module.css";

export default function SearchFilterBar() {
  const [filters, setFilters] = useState({
    search: "",
    gender: "",
    baseColour: "",
    season: "",
    category: "",
  });

  const router = useRouter();

  const handleChange = (name, value) => {
    const updated = { ...filters, [name]: value };
    setFilters(updated);

    const query = new URLSearchParams(updated).toString();
    router.push(`/products?${query}`);
  };

  return (
    <div className={styles.filterWrapper}>
      {/* Mobile filters */}
      <div className={styles.mobileFilters}>
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
        />
        <select
          value={filters.gender}
          onChange={(e) => handleChange("gender", e.target.value)}
        >
          <option value="">All Genders</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
        </select>
        <select
          value={filters.baseColour}
          onChange={(e) => handleChange("baseColour", e.target.value)}
        >
          <option value="">All Colours</option>
          <option value="Black">Black</option>
          <option value="White">White</option>
          <option value="Blue">Blue</option>
          <option value="Red">Red</option>
        </select>
        <select
          value={filters.season}
          onChange={(e) => handleChange("season", e.target.value)}
        >
          <option value="">All Seasons</option>
          <option value="Summer">Summer</option>
          <option value="Fall">Fall</option>
          <option value="Winter">Winter</option>
          <option value="Spring">Spring</option>
        </select>
      </div>

      {/* Desktop sidebar */}
      <aside className={styles.sidebar}>
        <h3>Categories</h3>
        {["Topwear", "Bottomwear", "Footwear"].map((cat) => (
          <label key={cat}>
            <input
              type="radio"
              name="category"
              value={cat}
              checked={filters.category === cat}
              onChange={() => handleChange("category", cat)}
            />
            {cat}
          </label>
        ))}

        <h3 className="mt-4">Gender</h3>
        {["Men", "Women"].map((g) => (
          <label key={g}>
            <input
              type="radio"
              name="gender"
              value={g}
              checked={filters.gender === g}
              onChange={() => handleChange("gender", g)}
            />
            {g}
          </label>
        ))}

        <h3 className="mt-4">Color</h3>
        {["Black", "White", "Blue", "Red"].map((c) => (
          <label key={c}>
            <input
              type="radio"
              name="baseColour"
              value={c}
              checked={filters.baseColour === c}
              onChange={() => handleChange("baseColour", c)}
            />
            {c}
          </label>
        ))}

        <h3 className="mt-4">Season</h3>
        {["Summer", "Fall", "Winter", "Spring"].map((s) => (
          <label key={s}>
            <input
              type="radio"
              name="season"
              value={s}
              checked={filters.season === s}
              onChange={() => handleChange("season", s)}
            />
            {s}
          </label>
        ))}
      </aside>
    </div>
  );
}

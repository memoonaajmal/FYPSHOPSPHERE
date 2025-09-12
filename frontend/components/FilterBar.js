"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./styles/SearchFilterBar.module.css";

export default function SearchFilterBar({ onFilterChange }) {
  const [filters, setFilters] = useState({
    search: "",
    gender: "",
    baseColour: "",
    season: "",
    category: "",
  });

  const router = useRouter();

  // Handles selection/deselection of filters
  const handleChange = (name, value) => {
    const updated = { ...filters, [name]: filters[name] === value ? "" : value };
    setFilters(updated);

    if (onFilterChange) onFilterChange(updated);

    const query = new URLSearchParams(updated).toString();
    router.push(`?${query}`, { shallow: true });
  };

  // Remove filter via × button
  const handleRemoveFilter = (e, name) => {
    e.stopPropagation(); // Prevent triggering radio input
    const updated = { ...filters, [name]: "" };
    setFilters(updated);

    if (onFilterChange) onFilterChange(updated);

    const query = new URLSearchParams(updated).toString();
    router.push(`?${query}`, { shallow: true });
  };

  // Render a radio option with a clickable ×
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
     

      {/* Desktop Sidebar */}
      <aside className={styles.sidebar}>
        <h3 className="mt-4">Gender</h3>
        {["Men", "Women"].map((g) => renderRadioOption("gender", g))}

        <h3 className="mt-4">Color</h3>
        {["Black", "White", "Blue", "Red"].map((c) => renderRadioOption("baseColour", c))}

        <h3 className="mt-4">Season</h3>
        {["Summer", "Fall", "Winter", "Spring"].map((s) => renderRadioOption("season", s))}
      </aside>
    </div>
  );
}

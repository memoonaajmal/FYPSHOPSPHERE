"use client";
import { useState } from "react";

export default function FilterBar({ onFilterChange }) {
  const [filters, setFilters] = useState({
    search: "",
    gender: "",
    baseColour: "",
    season: "",
    category: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...filters, [name]: value };
    setFilters(updated);
    onFilterChange(updated); // send updated filters to parent
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center">
      {/* Search */}
      <input
        type="text"
        name="search"
        placeholder="Search products..."
        value={filters.search}
        onChange={handleChange}
        className="border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-[200px]"
      />

      {/* Gender */}
      <select
        name="gender"
        value={filters.gender}
        onChange={handleChange}
        className="border border-gray-300 rounded-lg px-3 py-2"
      >
        <option value="">All Genders</option>
        <option value="Men">Men</option>
        <option value="Women">Women</option>
      </select>

      {/* Category */}
      <select
        name="category"
        value={filters.category}
        onChange={handleChange}
        className="border border-gray-300 rounded-lg px-3 py-2"
      >
        <option value="">All Categories</option>
        <option value="Topwear">Topwear</option>
        <option value="Bottomwear">Bottomwear</option>
        <option value="Footwear">Footwear</option>
      </select>

      {/* Color */}
      <select
        name="baseColour"
        value={filters.baseColour}
        onChange={handleChange}
        className="border border-gray-300 rounded-lg px-3 py-2"
      >
        <option value="">All Colours</option>
        <option value="Black">Black</option>
        <option value="White">White</option>
        <option value="Blue">Blue</option>
        <option value="Red">Red</option>
      </select>

      {/* Season */}
      <select
        name="season"
        value={filters.season}
        onChange={handleChange}
        className="border border-gray-300 rounded-lg px-3 py-2"
      >
        <option value="">All Seasons</option>
        <option value="Summer">Summer</option>
        <option value="Fall">Fall</option>
        <option value="Winter">Winter</option>
        <option value="Spring">Spring</option>
      </select>
    </div>
  );
}

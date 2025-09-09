"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

    // push new search params to URL
    const query = new URLSearchParams(updated).toString();
    router.push(`/products?${query}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Search + Dropdowns on top (mobile view) */}
      <div className="flex-1 md:hidden flex flex-wrap gap-4 items-center bg-white shadow-md rounded-xl p-4 mb-6">
        {/* Search */}
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => handleChange("search", e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 flex-1 min-w-[150px]"
        />

        {/* Gender */}
        <select
          value={filters.gender}
          onChange={(e) => handleChange("gender", e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">All Genders</option>
          <option value="Men">Men</option>
          <option value="Women">Women</option>
        </select>

        {/* Color */}
        <select
          value={filters.baseColour}
          onChange={(e) => handleChange("baseColour", e.target.value)}
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
          value={filters.season}
          onChange={(e) => handleChange("season", e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="">All Seasons</option>
          <option value="Summer">Summer</option>
          <option value="Fall">Fall</option>
          <option value="Winter">Winter</option>
          <option value="Spring">Spring</option>
        </select>
      </div>

      {/* Sidebar (desktop) */}
      <aside className="hidden md:block w-64 bg-gray-50 p-4 rounded-xl shadow-md">
        <h3 className="font-semibold mb-3">Categories</h3>
        {["Topwear", "Bottomwear", "Footwear"].map((cat) => (
          <div key={cat} className="mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={cat}
                checked={filters.category === cat}
                onChange={() => handleChange("category", cat)}
                className="accent-blue-500"
              />
              <span>{cat}</span>
            </label>
          </div>
        ))}

        <h3 className="font-semibold mt-4 mb-2">Gender</h3>
        {["Men", "Women"].map((g) => (
          <div key={g} className="mb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                value={g}
                checked={filters.gender === g}
                onChange={() => handleChange("gender", g)}
                className="accent-blue-500"
              />
              <span>{g}</span>
            </label>
          </div>
        ))}

        <h3 className="font-semibold mt-4 mb-2">Color</h3>
        {["Black", "White", "Blue", "Red"].map((c) => (
          <div key={c} className="mb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="baseColour"
                value={c}
                checked={filters.baseColour === c}
                onChange={() => handleChange("baseColour", c)}
                className="accent-blue-500"
              />
              <span>{c}</span>
            </label>
          </div>
        ))}

        <h3 className="font-semibold mt-4 mb-2">Season</h3>
        {["Summer", "Fall", "Winter", "Spring"].map((s) => (
          <div key={s} className="mb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="season"
                value={s}
                checked={filters.season === s}
                onChange={() => handleChange("season", s)}
                className="accent-blue-500"
              />
              <span>{s}</span>
            </label>
          </div>
        ))}
      </aside>
    </div>
  );
}

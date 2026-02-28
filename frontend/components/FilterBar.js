"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  TextField,
  Button,
  Radio,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

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
  const [searchInput, setSearchInput] = useState("");
  const router = useRouter();

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

  const handleChange = (name, value) => {
    updateFilters({ ...filters, [name]: value });
  };

  const handleRemoveFilter = (e, name) => {
    e.stopPropagation();
    updateFilters({ ...filters, [name]: "" });
    if (name === "search") setSearchInput("");
  };

  const handleSearch = () => {
    updateFilters({ ...filters, search: searchInput });
  };

  const handleSearchKey = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const renderRadioOption = (name, value) => (
    <Box
      key={`${name}-${value}`}
      sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
    >
      <FormControlLabel
        control={
          <Radio
            size="small"
            checked={filters[name] === value}
            onChange={() => handleChange(name, value)}
            sx={{ color: "grey.500", "&.Mui-checked": { color: "primary.main" } }}
          />
        }
        label={
          <Typography variant="body2" sx={{ color: "text.primary" }}>
            {value}
          </Typography>
        }
        sx={{ m: 0 }}
      />
      {filters[name] === value && (
        <IconButton
          size="small"
          onClick={(e) => handleRemoveFilter(e, name)}
          sx={{ p: 0.25, color: "grey.500", "&:hover": { color: "error.main" } }}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      )}
    </Box>
  );

  const SectionLabel = ({ children }) => (
    <Typography
      variant="overline"
      sx={{
        display: "block",
        fontWeight: 700,
        color: "text.secondary",
        letterSpacing: 1.2,
        mt: 3,
        mb: 0.5,
      }}
    >
      {children}
    </Typography>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        p: 2,
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 1,
    
      }}
    >
      {/* Search */}
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleSearchKey}
          InputProps={{
            endAdornment: filters.search && (
              <IconButton
                size="small"
                onClick={(e) => handleRemoveFilter(e, "search")}
                sx={{ p: 0.25, color: "grey.500", "&:hover": { color: "error.main" } }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleSearch}
          sx={{ whiteSpace: "nowrap", textTransform: "none", px: 2 }}
        >
          Search
        </Button>
      </Box>

      {/* Sidebar Filters */}
      <Box component="aside">
        <SectionLabel>Gender</SectionLabel>
        {["Men", "Women"].map((g) => renderRadioOption("gender", g))}

        <SectionLabel>Color</SectionLabel>
        {["Black", "White", "Blue", "Red"].map((c) =>
          renderRadioOption("baseColour", c)
        )}

        <SectionLabel>Season</SectionLabel>
        {["Summer", "Fall", "Winter", "Spring"].map((s) =>
          renderRadioOption("season", s)
        )}
      </Box>
    </Box>
  );
}
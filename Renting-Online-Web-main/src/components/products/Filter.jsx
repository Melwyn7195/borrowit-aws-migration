import React, { useState, useRef } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";

const Filter = ({ onFilterChange, filters = {} }) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    condition: true,
    price: true,
    rating: true,
  });

  const [filterState, setFilterState] = useState({
    category: filters.category || "",
    condition: filters.condition || "",
    priceMin: filters.priceMin || "",
    priceMax: filters.priceMax || "",
    rating: filters.rating || "",
    ...filters,
  });

  const priceMinRef = useRef(null);
  const priceMaxRef = useRef(null);

  const categories = [
    { value: "Electronics", label: "Electronics" },
    { value: "Clothes", label: "Clothes" },
    { value: "Furniture", label: "Furniture" },
    { value: "Sports", label: "Sports" },
    { value: "Books", label: "Books" },
    { value: "Tools", label: "Tools" },
    { value: "Vehicles", label: "Vehicles" },
    { value: "Other", label: "Other" },
  ];

  const conditions = [
    { value: "New", label: "New" },
    { value: "Like New", label: "Like New" },
    { value: "Excellent", label: "Excellent" },
    { value: "Good", label: "Good" },
    { value: "Fair", label: "Fair" },
  ];

  const ratings = [
    { value: "5", label: "5 Stars" },
    { value: "4", label: "4+ Stars" },
    { value: "3", label: "3+ Stars" },
    { value: "2", label: "2+ Stars" },
    { value: "1", label: "1+ Stars" },
  ];

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filterState,
      [key]: value,
    };
    setFilterState(newFilters);
    onFilterChange && onFilterChange(newFilters);
  };

  const handlePriceChange = (key, value) => {
    // Update local state only, without triggering parent filter change
    setFilterState((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Keep focus in the appropriate input field
    if (key === "priceMin" && priceMinRef.current) {
      setTimeout(() => {
        priceMinRef.current.focus();
      }, 0);
    } else if (key === "priceMax" && priceMaxRef.current) {
      setTimeout(() => {
        priceMaxRef.current.focus();
      }, 0);
    }
  };

  const handlePriceApply = () => {
    // Apply the price filter when user presses Enter or leaves the input
    if (onFilterChange) {
      onFilterChange(filterState);
    }
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      category: "",
      condition: "",
      priceMin: "",
      priceMax: "",
      rating: "",
    };
    setFilterState(clearedFilters);
    onFilterChange && onFilterChange(clearedFilters);
  };

  const FilterSection = ({ title, isExpanded, onToggle, children }) => (
    <div className="border-b border-gray-200 pb-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-2 text-left"
      >
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {isExpanded ? (
          <FiChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <FiChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isExpanded && <div className="mt-4 space-y-3">{children}</div>}
    </div>
  );

  const StarRating = ({ rating }) => (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) =>
        star <= rating ? (
          <AiFillStar key={star} className="h-4 w-4 text-yellow-400" />
        ) : (
          <AiOutlineStar key={star} className="h-4 w-4 text-gray-300" />
        )
      )}
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
        <button
          onClick={clearAllFilters}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <FilterSection
          title="Category"
          isExpanded={expandedSections.category}
          onToggle={() => toggleSection("category")}
        >
          <select
            value={filterState.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </FilterSection>

        {/* Condition Filter */}
        <FilterSection
          title="Condition"
          isExpanded={expandedSections.condition}
          onToggle={() => toggleSection("condition")}
        >
          <div className="space-y-2">
            {conditions.map((condition) => (
              <label key={condition.value} className="flex items-center">
                <input
                  type="radio"
                  name="condition"
                  value={condition.value}
                  checked={filterState.condition === condition.value}
                  onChange={(e) =>
                    handleFilterChange("condition", e.target.value)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {condition.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Price Filter */}
        <FilterSection
          title="Price"
          isExpanded={expandedSections.price}
          onToggle={() => toggleSection("price")}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Price (VND)
                </label>
                <input
                  type="number"
                  ref={priceMinRef}
                  placeholder="0"
                  value={filterState.priceMin}
                  onChange={(e) =>
                    handlePriceChange("priceMin", e.target.value)
                  }
                  onBlur={handlePriceApply}
                  onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={0}
                  step={1000}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Price (VND)
                </label>
                <input
                  type="number"
                  ref={priceMaxRef}
                  placeholder="1000000"
                  value={filterState.priceMax}
                  onChange={(e) =>
                    handlePriceChange("priceMax", e.target.value)
                  }
                  onBlur={handlePriceApply}
                  onKeyDown={(e) => e.key === "Enter" && handlePriceApply()}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={0}
                  step={1000}
                />
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Rating Filter */}
        {/* <FilterSection
          title="Rating"
          isExpanded={expandedSections.rating}
          onToggle={() => toggleSection("rating")}
        >
          <div className="space-y-2">
            {ratings.map((rating) => (
              <label key={rating.value} className="flex items-center">
                <input
                  type="radio"
                  name="rating"
                  value={rating.value}
                  checked={filterState.rating === rating.value}
                  onChange={(e) => handleFilterChange("rating", e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-2 flex items-center space-x-2">
                  <StarRating rating={parseInt(rating.value)} />
                  <span className="text-sm text-gray-700">{rating.label}</span>
                </div>
              </label>
            ))}
          </div>
        </FilterSection> */}
      </div>

      {/* Apply Button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            console.log('Filter state:', filterState); // Debug log
            onFilterChange && onFilterChange(filterState);
          }}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default Filter;

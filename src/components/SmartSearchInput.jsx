import React, { useState } from 'react';

// Levenshtein distance algorithm for fuzzy search
const levenshteinDistance = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
};

/**
 * SmartSearchInput - A reusable autocomplete search component with fuzzy matching
 * 
 * @param {Object} props
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Called when search value changes
 * @param {Array} props.dataSource - Array of data to search through
 * @param {Function} props.getSearchValue - Function to extract search value from data item
 * @param {string} props.placeholder - Input placeholder text
 * @param {string} props.className - Additional CSS classes for the input
 * @param {number} props.maxSuggestions - Maximum number of suggestions to show (default: 5)
 * @param {number} props.fuzzyThreshold - Fuzzy match threshold multiplier (default: 0.4)
 */
const SmartSearchInput = ({
  value,
  onChange,
  dataSource = [],
  getSearchValue,
  placeholder = 'Search...',
  className = '',
  maxSuggestions = 5,
  fuzzyThreshold = 0.4,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Generate autocomplete suggestions based on search term
  const generateSuggestions = (searchValue) => {
    if (!searchValue || searchValue.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchLower = searchValue.toLowerCase();
    const uniqueValues = new Set();
    
    // Get unique values based on getSearchValue function
    dataSource.forEach(item => {
      const fieldValue = getSearchValue(item);
      if (fieldValue) {
        uniqueValues.add(fieldValue);
      }
    });

    // Filter and rank suggestions using fuzzy matching
    const rankedSuggestions = Array.from(uniqueValues)
      .map(item => {
        const itemLower = item.toLowerCase();
        const startsWithMatch = itemLower.startsWith(searchLower);
        const includesMatch = itemLower.includes(searchLower);
        const distance = levenshteinDistance(searchLower, itemLower);
        
        // Calculate score (lower is better)
        let score = distance;
        if (startsWithMatch) score -= 1000; // Prioritize starts with
        if (includesMatch) score -= 100; // Then includes
        
        return { item, score, distance };
      })
      .filter(({ distance, item }) => {
        // Show if it's a direct match or fuzzy match within threshold
        const threshold = Math.max(2, Math.floor(searchLower.length * fuzzyThreshold));
        return item.toLowerCase().includes(searchLower) || distance <= threshold;
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, maxSuggestions)
      .map(({ item }) => item);

    setSuggestions(rankedSuggestions);
    setShowSuggestions(rankedSuggestions.length > 0);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    generateSuggestions(newValue);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleSearchChange}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={() => {
          // Delay to allow clicking on suggestions
          setTimeout(() => setShowSuggestions(false), 200);
        }}
        className={className || "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"}
      />
      
      {/* Autocomplete Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="flex-1">{suggestion}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartSearchInput;

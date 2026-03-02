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
  searchFields = [],
  selectedFeature,
  onFeatureChange,
  defaultFeatureKey,
  placeholder = 'Search...',
  className = '',
  maxSuggestions = 5,
  fuzzyThreshold = 0.4,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [internalFeature, setInternalFeature] = useState(
    defaultFeatureKey || searchFields[0]?.key || 'default'
  );

  const featureOptions = searchFields.length > 0
    ? searchFields
    : [{ key: 'default', label: 'All', getValue: getSearchValue }];

  const activeFeature = selectedFeature ?? internalFeature;
  const activeFeatureIndex = Math.max(0, featureOptions.findIndex((field) => field.key === activeFeature));

  const getActiveExtractor = () => {
    const selected = featureOptions.find((field) => field.key === activeFeature);
    return selected?.getValue || getSearchValue;
  };

  const normalizeValues = (fieldValue) => {
    if (fieldValue === null || fieldValue === undefined) return [];
    if (Array.isArray(fieldValue)) {
      return fieldValue
        .filter((item) => item !== null && item !== undefined && String(item).trim() !== '')
        .map((item) => String(item));
    }
    return String(fieldValue).trim() ? [String(fieldValue)] : [];
  };

  const handleFeatureChange = (featureKey) => {
    if (onFeatureChange) {
      onFeatureChange(featureKey);
    } else {
      setInternalFeature(featureKey);
    }

    if (!value || value.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setTimeout(() => generateSuggestions(value, featureKey), 0);
  };

  // Generate autocomplete suggestions based on search term
  const generateSuggestions = (searchValue, featureKeyOverride) => {
    if (!searchValue || searchValue.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchLower = searchValue.toLowerCase();
    const uniqueValues = new Set();
    const featureKey = featureKeyOverride || activeFeature;
    const selected = featureOptions.find((field) => field.key === featureKey);
    const extractor = selected?.getValue || getActiveExtractor();
    
    // Get unique values based on getSearchValue function
    dataSource.forEach(item => {
      const fieldValue = extractor ? extractor(item) : getSearchValue?.(item);
      const normalized = normalizeValues(fieldValue);
      normalized.forEach((entry) => uniqueValues.add(entry));
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

  const computedPlaceholder = (() => {
    const sel = featureOptions.find((f) => f.key === activeFeature);
    if (!sel) return placeholder;
    const label = (sel.label || sel.key || '').toLowerCase();
    if (label === 'all' || label === 'default') return placeholder;
    return `Search for ${label}...`;
  })();

  return (
    <div className="relative w-full">
      <div className="flex w-full items-center gap-2">
        {featureOptions.length > 1 && (
          <div
            className="relative flex p-1 rounded-md border border-gray-200 bg-gray-50 h-9"
          >
            <span
              className="absolute top-1 bottom-1 rounded-md bg-blue-600 transition-transform duration-300 ease-out"
              style={{
                width: `calc((100% - 0.5rem) / ${featureOptions.length})`,
                transform: `translateX(${activeFeatureIndex * 100}%)`,
                left: '0.25rem',
              }}
            />
            {featureOptions.map((field) => {
              const selected = activeFeature === field.key;
              return (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => handleFeatureChange(field.key)}
                  className={`relative z-10 px-3 py-0 text-xs font-semibold rounded-md whitespace-nowrap transition-colors duration-200 ${
                    selected ? 'text-white' : 'text-gray-600 hover:text-blue-600'
                  }`}
                  style={{ width: `calc(100% / ${featureOptions.length})` }}
                >
                  {field.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="relative flex-1 group">
          <input
            type="text"
            placeholder={computedPlaceholder}
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
            className={
              className ||
              "w-full border border-gray-300 rounded-md px-3 py-1.5 h-9 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all pr-8"
            }
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Autocomplete Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto py-1">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 flex items-center gap-2 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="flex-1 truncate">{suggestion}</span>
              <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

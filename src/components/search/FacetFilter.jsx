import { useState } from "react";

/**
 * FacetFilter — Sidebar component for filtering search results
 * using Solr facets (aggregation counts).
 *
 * @param {object}   props
 * @param {object}   props.facets        - { fieldName: { value: count, ... }, ... }
 * @param {object}   props.activeFilters - Currently active filters
 * @param {Function} props.onFilterChange - Called with updated filters object
 * @param {string}   props.type          - "jobs" | "blogs"
 * @param {boolean}  props.degraded      - If true, no facets available
 */
export default function FacetFilter({
  facets = {},
  activeFilters = {},
  onFilterChange,
  type = "jobs",
  degraded = false,
}) {
  const [budgetMin, setBudgetMin] = useState(activeFilters.budgetMin || "");
  const [budgetMax, setBudgetMax] = useState(activeFilters.budgetMax || "");
  const [collapsed, setCollapsed] = useState({});

  /** Friendly labels for facet field names */
  const FACET_LABELS = {
    jobType: "Job Type",
    experienceLevel: "Experience Level",
    remote: "Remote",
    skills_facet: "Skills",
    category: "Category",
    featured: "Featured",
  };

  /** Toggle a facet value in the filter */
  const toggleFilter = (field, value) => {
    const updated = { ...activeFilters };

    // Map Solr facet field to filter key
    const filterKey = field === "skills_facet" ? "skills" : field;

    if (updated[filterKey] === value) {
      delete updated[filterKey];
    } else {
      updated[filterKey] = value;
    }

    onFilterChange(updated);
  };

  /** Apply budget range filter */
  const applyBudget = () => {
    const updated = { ...activeFilters };
    if (budgetMin) updated.budgetMin = Number(budgetMin);
    else delete updated.budgetMin;
    if (budgetMax) updated.budgetMax = Number(budgetMax);
    else delete updated.budgetMax;
    onFilterChange(updated);
  };

  /** Clear all active filters */
  const clearAll = () => {
    setBudgetMin("");
    setBudgetMax("");
    onFilterChange({});
  };

  /** Toggle section collapse */
  const toggleSection = (field) => {
    setCollapsed((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Get active filter keys (excluding budget range)
  const activeKeys = Object.keys(activeFilters).filter(
    (k) => k !== "budgetMin" && k !== "budgetMax" && k !== "status",
  );

  const hasBudgetFilter = activeFilters.budgetMin || activeFilters.budgetMax;
  const hasAnyFilter = activeKeys.length > 0 || hasBudgetFilter;

  // No facets in degraded mode
  if (degraded) {
    return (
      <div className="bg-amber-50/50 rounded-xl border border-amber-100 p-4 text-sm text-amber-700" id="facet-degraded">
        <p className="font-medium mb-1">Filters unavailable</p>
        <p className="text-amber-600 text-xs">Search is running in limited mode. Facet filters require the full search engine.</p>
      </div>
    );
  }

  // No facets data available yet
  if (Object.keys(facets).length === 0) {
    return null;
  }

  return (
    <div className="space-y-4" id="facet-filters">
      {/* ── Active Filter Chips ──────────────────── */}
      {hasAnyFilter && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Active Filters
            </h4>
            <button
              onClick={clearAll}
              className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeKeys.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
              >
                {activeFilters[key]}
                <button
                  onClick={() => {
                    const updated = { ...activeFilters };
                    delete updated[key];
                    onFilterChange(updated);
                  }}
                  className="ml-0.5 text-blue-400 hover:text-blue-600"
                  aria-label={`Remove ${key} filter`}
                >
                  ×
                </button>
              </span>
            ))}
            {hasBudgetFilter && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                ₹{activeFilters.budgetMin || "0"} – ₹{activeFilters.budgetMax || "∞"}
                <button
                  onClick={() => {
                    const updated = { ...activeFilters };
                    delete updated.budgetMin;
                    delete updated.budgetMax;
                    setBudgetMin("");
                    setBudgetMax("");
                    onFilterChange(updated);
                  }}
                  className="ml-0.5 text-green-400 hover:text-green-600"
                  aria-label="Remove budget filter"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Facet Sections ───────────────────────── */}
      {Object.entries(facets).map(([field, values]) => {
        const entries = Object.entries(values);
        if (entries.length === 0) return null;

        const isCollapsed = collapsed[field];
        const filterKey = field === "skills_facet" ? "skills" : field;

        return (
          <div
            key={field}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleSection(field)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <h4 className="text-sm font-semibold text-gray-700">
                {FACET_LABELS[field] || field}
              </h4>
              <svg
                className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${
                  isCollapsed ? "" : "rotate-180"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {!isCollapsed && (
              <div className="px-4 pb-3 space-y-1">
                {entries.map(([value, count]) => {
                  const isActive = activeFilters[filterKey] === value;
                  return (
                    <label
                      key={value}
                      className={`flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer transition-colors ${
                        isActive ? "bg-blue-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggleFilter(field, value)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/30"
                        />
                        <span
                          className={`text-sm ${
                            isActive ? "text-blue-700 font-medium" : "text-gray-600"
                          }`}
                        >
                          {value === "true" ? "Yes" : value === "false" ? "No" : value}
                        </span>
                      </div>
                      <span
                        className={`text-xs rounded-full px-1.5 py-0.5 ${
                          isActive
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {count}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Budget Range (Jobs only) ─────────────── */}
      {type === "jobs" && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Budget Range</h4>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="number"
              placeholder="Max"
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none"
            />
          </div>
          <button
            onClick={applyBudget}
            className="mt-2 w-full py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            Apply Range
          </button>
        </div>
      )}
    </div>
  );
}

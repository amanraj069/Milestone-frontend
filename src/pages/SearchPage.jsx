import { useState } from "react";
import useSearch from "../hooks/useSearch";
import SolrSearchBar from "../components/search/SolrSearchBar";
import SearchResults from "../components/search/SearchResults";
import FacetFilter from "../components/search/FacetFilter";

/**
 * SearchPage — Full-featured search page composing SolrSearchBar,
 * FacetFilter sidebar, and SearchResults.
 *
 * Route: /search
 */
export default function SearchPage() {
  const [type, setType] = useState("jobs");
  const [showFilters, setShowFilters] = useState(false);

  const {
    query,
    setQuery,
    results,
    loading,
    error,
    facets,
    total,
    page,
    totalPages,
    degraded,
    filters,
    setFilters,
    sort,
    setSort,
    setPage,
  } = useSearch({ type });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30" id="search-page">
      {/* ── Hero / Search Header ────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-2">
            Discover Opportunities
          </h1>
          <p className="text-gray-500 text-center text-sm sm:text-base mb-6">
            Search across job listings and blog posts on Milestone
          </p>

          <SolrSearchBar
            query={query}
            onQueryChange={setQuery}
            type={type}
            onTypeChange={(t) => {
              setType(t);
              setFilters({});
            }}
            loading={loading}
          />
        </div>
      </div>

      {/* ── Main Content ───────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Toolbar */}
        {query && results.length > 0 && (
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="sort-select"
                className="text-sm text-gray-500 font-medium"
              >
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none cursor-pointer"
              >
                <option value="relevance">Relevance</option>
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
                {type === "jobs" && (
                  <>
                    <option value="budget_desc">Highest budget</option>
                    <option value="budget_asc">Lowest budget</option>
                  </>
                )}
              </select>
            </div>

            {/* Mobile filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {Object.keys(filters).length > 0 && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {Object.keys(filters).length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Grid: Sidebar (filters) + Main (results) */}
        <div className="flex gap-6">
          {/* ── Sidebar (Facet Filters) ──────────── */}
          {query && (
            <aside
              className={`w-64 flex-shrink-0 ${
                showFilters
                  ? "fixed inset-0 z-50 bg-white overflow-y-auto p-4 lg:relative lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0"
                  : "hidden lg:block"
              }`}
            >
              {/* Mobile close button */}
              {showFilters && (
                <div className="flex items-center justify-between mb-4 lg:hidden">
                  <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              <FacetFilter
                facets={facets}
                activeFilters={filters}
                onFilterChange={(newFilters) => {
                  setFilters(newFilters);
                  setShowFilters(false);
                }}
                type={type}
                degraded={degraded}
              />
            </aside>
          )}

          {/* ── Main Results Area ────────────────── */}
          <main className="flex-1 min-w-0">
            <SearchResults
              results={results}
              total={total}
              page={page}
              totalPages={totalPages}
              loading={loading}
              error={error}
              degraded={degraded}
              query={query}
              type={type}
              onPageChange={setPage}
            />
          </main>
        </div>
      </div>
    </div>
  );
}

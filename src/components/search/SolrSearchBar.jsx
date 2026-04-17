import { useState, useRef, useEffect } from "react";
import useSuggestions from "../../hooks/useSuggestions";

/**
 * SolrSearchBar — Full-featured search bar with autocomplete,
 * type toggle (Jobs / Blogs), and keyboard navigation.
 *
 * @param {object} props
 * @param {string}   props.query       - Current search query
 * @param {Function} props.onQueryChange - Called when query text changes
 * @param {string}   props.type        - "jobs" | "blogs"
 * @param {Function} props.onTypeChange  - Called when type toggle changes
 * @param {boolean}  props.loading     - Show loading indicator
 * @param {boolean}  props.hideToggle  - Hide the jobs/blogs toggle slider
 * @param {Function} props.onSearch    - Called when form is explicitly submitted (enter/clicked)
 */
export default function SolrSearchBar({
  query = "",
  onQueryChange,
  type = "jobs",
  onTypeChange,
  loading = false,
  hideToggle = false,
  onSearch,
}) {
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const { suggestions } = useSuggestions(query, type);

  // Open dropdown when suggestions arrive
  useEffect(() => {
    if (suggestions.length > 0 && query.trim().length >= 2) {
      setOpen(true);
      setActiveIdx(-1);
    } else {
      setOpen(false);
    }
  }, [suggestions, query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectSuggestion = (text) => {
    onQueryChange(text);
    setOpen(false);
    inputRef.current?.focus();
    if (onSearch) onSearch(text, type);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      // If a dropdown item is active, select it
      if (open && suggestions.length > 0 && activeIdx >= 0 && activeIdx < suggestions.length) {
        selectSuggestion(suggestions[activeIdx]);
      } else {
        // Otherwise submit whatever is typed
        setOpen(false);
        if (onSearch) onSearch(query, type);
      }
      return;
    }

    if (!open || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      default:
        break;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto relative" id="solr-search-bar">
      {/* ── Type Toggle ───────────────────────────── */}
      {!hideToggle && (
        <div className="flex justify-center mb-3">
          <div className="inline-flex rounded-full p-1 bg-gray-100 border border-gray-200">
            {["jobs", "blogs"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onTypeChange?.(t)}
                className={`px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 capitalize ${
                  type === t
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Search Input ──────────────────────────── */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          id="solr-search-input"
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={`Search ${type === "jobs" ? "job listings" : "blog posts"}...`}
          className="w-full pl-12 pr-12 py-3.5 text-base rounded-xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none transition-all placeholder:text-gray-400"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={open}
        />

        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Clear button */}
        {!loading && query && (
          <button
            type="button"
            onClick={() => {
              onQueryChange("");
              inputRef.current?.focus();
            }}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* ── Suggestions Dropdown ──────────────────── */}
      {open && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          id="search-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {suggestions.map((s, i) => (
            <button
              key={`${s}-${i}`}
              type="button"
              role="option"
              aria-selected={i === activeIdx}
              onClick={() => selectSuggestion(s)}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${
                i === activeIdx
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <svg
                className={`w-4 h-4 flex-shrink-0 ${
                  i === activeIdx ? "text-blue-500" : "text-gray-400"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="flex-1 truncate">{s}</span>
              <svg
                className={`w-3.5 h-3.5 flex-shrink-0 ${
                  i === activeIdx ? "text-blue-400" : "text-gray-300"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

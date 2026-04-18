import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { getBackendBaseUrl } from "../utils/backendBaseUrl";

const BACKEND_URL = getBackendBaseUrl();

/**
 * useSearch — Debounced full-text search hook powered by Solr.
 *
 * @param {object} opts
 * @param {"jobs"|"blogs"} opts.type  - Which index to search (default "jobs")
 * @param {number} opts.debounceMs    - Debounce delay in ms (default 300)
 * @param {number} opts.initialLimit  - Results per page (default 10)
 *
 * @returns {{
 *   query: string,
 *   setQuery: Function,
 *   results: Array,
 *   loading: boolean,
 *   error: string|null,
 *   facets: object,
 *   total: number,
 *   page: number,
 *   totalPages: number,
 *   degraded: boolean,
 *   filters: object,
 *   setFilters: Function,
 *   sort: string,
 *   setSort: Function,
 *   setPage: Function,
 *   search: Function,
 * }}
 */
export default function useSearch({
  type = "jobs",
  debounceMs = 300,
  initialLimit = 10,
} = {}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [facets, setFacets] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [degraded, setDegraded] = useState(false);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState("relevance");

  const debounceTimer = useRef(null);
  const abortController = useRef(null);

  /**
   * Execute the search API call.
   */
  const executeSearch = useCallback(
    async (searchQuery, searchPage, searchFilters, searchSort) => {
      // Cancel any in-flight request
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const params = {
          q: searchQuery || "",
          type,
          page: searchPage,
          limit: initialLimit,
          filters: JSON.stringify(searchFilters || {}),
          sort: searchSort || "relevance",
        };

        const { data } = await axios.get(`${BACKEND_URL}/api/search`, {
          params,
          signal: abortController.current.signal,
        });

        if (data.success) {
          setResults(data.results || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 0);
          setFacets(data.facets || {});
          setDegraded(!!data.degraded);
        } else {
          setError(data.message || "Search failed");
        }
      } catch (err) {
        if (axios.isCancel(err) || err.name === "CanceledError") return;
        console.error("[useSearch] Error:", err);
        setError(err.response?.data?.message || "Search request failed");
      } finally {
        setLoading(false);
      }
    },
    [type, initialLimit],
  );

  /**
   * Debounced search triggered by query/filter/sort changes.
   */
  const search = useCallback(
    (overrideQuery) => {
      const q = overrideQuery !== undefined ? overrideQuery : query;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        executeSearch(q, page, filters, sort);
      }, debounceMs);
    },
    [query, page, filters, sort, debounceMs, executeSearch],
  );

  // Re-search when page, filters, or sort change (no debounce)
  useEffect(() => {
    if (query.trim()) {
      executeSearch(query, page, filters, sort);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters, sort]);

  // Debounced search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      setTotalPages(0);
      setFacets({});
      setDegraded(false);
      return;
    }

    // Reset to page 1 on new query
    setPage(1);
    search(query);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      if (abortController.current) abortController.current.abort();
    };
  }, []);

  return {
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
    search,
  };
}

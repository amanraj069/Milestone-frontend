import { useState, useEffect, useRef } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

/**
 * useSuggestions — Autocomplete suggestions hook.
 *
 * @param {string} query       - Current partial input
 * @param {"jobs"|"blogs"} type - Core to query
 * @param {number} debounceMs  - Debounce delay (default 200)
 *
 * @returns {{ suggestions: string[], loading: boolean }}
 */
export default function useSuggestions(query = "", type = "jobs", debounceMs = 200) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const controller = useRef(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    if (timer.current) clearTimeout(timer.current);

    timer.current = setTimeout(async () => {
      if (controller.current) controller.current.abort();
      controller.current = new AbortController();

      setLoading(true);
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/search/suggest`, {
          params: { q: query.trim(), type },
          signal: controller.current.signal,
        });
        setSuggestions(data.suggestions || []);
      } catch (err) {
        if (!axios.isCancel(err) && err.name !== "CanceledError") {
          console.error("[useSuggestions] Error:", err);
        }
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, type, debounceMs]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (controller.current) controller.current.abort();
    };
  }, []);

  return { suggestions, loading };
}

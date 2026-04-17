/**
 * SearchResults — Renders Solr search results with highlighted text,
 * pagination, loading skeletons, and degraded-mode banner.
 *
 * @param {object}   props
 * @param {Array}    props.results    - Search result documents
 * @param {number}   props.total      - Total matched documents
 * @param {number}   props.page       - Current page
 * @param {number}   props.totalPages - Total pages
 * @param {boolean}  props.loading    - Loading state
 * @param {string}   props.error      - Error message
 * @param {boolean}  props.degraded   - Whether Solr is down (fallback mode)
 * @param {string}   props.query      - Current search query
 * @param {string}   props.type       - "jobs" | "blogs"
 * @param {Function} props.onPageChange - Called with new page number
 */
export default function SearchResults({
  results = [],
  total = 0,
  page = 1,
  totalPages = 0,
  loading = false,
  error = null,
  degraded = false,
  query = "",
  type = "jobs",
  onPageChange,
}) {
  /**
   * Render highlighted HTML safely.
   * Solr returns <mark>...</mark> tags in highlights.
   */
  const renderHighlight = (highlights, field, fallback = "") => {
    const highlighted = highlights?.[field];
    if (highlighted && highlighted.length > 0) {
      return (
        <span
          dangerouslySetInnerHTML={{
            __html: highlighted.join(" ... "),
          }}
        />
      );
    }
    // Truncate fallback
    const text = fallback || "";
    return text.length > 200 ? text.slice(0, 200) + "…" : text;
  };

  // ── Loading Skeleton ────────────────────────────────
  if (loading && results.length === 0) {
    return (
      <div className="space-y-4" id="search-results-skeleton">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse"
          >
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
            <div className="h-3 bg-gray-100 rounded w-full mb-2" />
            <div className="h-3 bg-gray-100 rounded w-5/6 mb-4" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-100 rounded-full w-20" />
              <div className="h-6 bg-gray-100 rounded-full w-16" />
              <div className="h-6 bg-gray-100 rounded-full w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error State ─────────────────────────────────────
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center" id="search-error">
        <svg className="w-10 h-10 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-red-700 font-medium">{error}</p>
        <p className="text-red-500 text-sm mt-1">Please try again later.</p>
      </div>
    );
  }

  // ── Empty State ─────────────────────────────────────
  if (!loading && query && results.length === 0) {
    return (
      <div className="text-center py-16" id="search-empty">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">No results found</h3>
        <p className="text-gray-500 text-sm max-w-md mx-auto">
          We couldn&apos;t find any {type === "jobs" ? "job listings" : "blog posts"} matching
          &ldquo;<span className="font-medium text-gray-600">{query}</span>&rdquo;.
          Try adjusting your search terms or filters.
        </p>
      </div>
    );
  }

  // ── No query yet ────────────────────────────────────
  if (!query) {
    return (
      <div className="text-center py-16" id="search-prompt">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-600">Start searching</h3>
        <p className="text-gray-400 text-sm mt-1">
          Type a query above to search {type === "jobs" ? "job listings" : "blog posts"}
        </p>
      </div>
    );
  }

  // ── Results ─────────────────────────────────────────
  return (
    <div id="search-results">
      {/* Degraded mode banner */}
      {degraded && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
          </svg>
          <p className="text-amber-700 text-sm">
            <span className="font-semibold">Search is running in limited mode.</span>{" "}
            Results may be less accurate. Facets and highlighting are unavailable.
          </p>
        </div>
      )}

      {/* Result count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-700">{results.length}</span> of{" "}
          <span className="font-semibold text-gray-700">{total.toLocaleString()}</span> results
          {loading && <span className="ml-2 text-blue-500">Updating...</span>}
        </p>
      </div>

      {/* Result cards */}
      <div className="space-y-3">
        {results.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-md transition-all duration-200 group"
            id={`result-${doc.id}`}
          >
            {/* Title with highlight */}
            <h3 className="text-base font-semibold text-gray-800 group-hover:text-blue-600 transition-colors mb-1.5 [&_mark]:bg-yellow-200 [&_mark]:text-yellow-900 [&_mark]:rounded [&_mark]:px-0.5">
              {renderHighlight(doc.highlights, "title", doc.title)}
            </h3>

            {/* Description with highlight */}
            <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-2 [&_mark]:bg-yellow-100 [&_mark]:text-yellow-900 [&_mark]:rounded [&_mark]:px-0.5">
              {renderHighlight(doc.highlights, "description", doc.description)}
            </p>

            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Job-specific tags */}
              {type === "jobs" && (
                <>
                  {doc.jobType && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {doc.jobType}
                    </span>
                  )}
                  {doc.experienceLevel && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                      {doc.experienceLevel}
                    </span>
                  )}
                  {doc.budget > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                      ₹{doc.budget.toLocaleString()}
                    </span>
                  )}
                  {doc.remote && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100">
                      🌐 Remote
                    </span>
                  )}
                  {doc.location && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                      📍 {doc.location}
                    </span>
                  )}
                  {(doc.skills || []).slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                    >
                      {skill}
                    </span>
                  ))}
                </>
              )}

              {/* Blog-specific tags */}
              {type === "blogs" && (
                <>
                  {doc.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-700 border border-pink-100">
                      {doc.category}
                    </span>
                  )}
                  {doc.author && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                      ✍️ {doc.author}
                    </span>
                  )}
                  {doc.readTime && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                      ⏱ {doc.readTime} min read
                    </span>
                  )}
                </>
              )}

              {/* Score badge (dev mode) */}
              {doc.score !== undefined && import.meta.env.DEV && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-400 ml-auto">
                  score: {doc.score.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination ───────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-8" id="search-pagination">
          <button
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Prev
          </button>

          {generatePageNumbers(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[36px] px-2 py-1.5 text-sm rounded-lg border transition-colors ${
                  p === page
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Generate an array of page numbers to display, with ellipsis.
 * Always shows first, last, and pages around the current page.
 */
function generatePageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set([1, total]);

  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.add(i);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const result = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("...");
    }
    result.push(sorted[i]);
  }

  return result;
}

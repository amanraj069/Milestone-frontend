import React, { useState, useRef, useEffect } from 'react';

export default function ColumnToggle({ columns, visible, onChange, storageKey }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (key) => {
    const next = new Set(visible);
    if (next.has(key)) {
      if (next.size > 1) next.delete(key);
    } else {
      next.add(key);
    }
    onChange(next);
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify([...next]));
    }
  };

  const showAll = () => {
    const all = new Set(columns.map((c) => c.key));
    onChange(all);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify([...all]));
  };

  const resetDefaults = () => {
    const defaults = new Set(columns.filter((c) => c.defaultVisible !== false).map((c) => c.key));
    onChange(defaults);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify([...defaults]));
  };

  const visibleCount = visible.size;
  const totalCount = columns.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
      >
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        Columns
        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
          {visibleCount}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-gray-900 text-white rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-700">
            <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Toggle & Reorder Columns
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {columns.map((col) => (
              <label
                key={col.key}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={visible.has(col.key)}
                  onChange={() => toggle(col.key)}
                  className="w-4 h-4 rounded border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900 bg-gray-700"
                />
                <span className="text-sm">{col.label}</span>
              </label>
            ))}
          </div>
          <div className="px-4 py-2.5 border-t border-gray-700 flex justify-between">
            <button
              onClick={showAll}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Show all columns
            </button>
            <button
              onClick={resetDefaults}
              className="text-xs text-gray-400 hover:text-gray-300 font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function useColumnToggle(columns, storageKey) {
  const [visible, setVisible] = useState(() => {
    if (storageKey) {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) return new Set(JSON.parse(stored));
      } catch {}
    }
    return new Set(columns.filter((c) => c.defaultVisible !== false).map((c) => c.key));
  });

  return { visible, setVisible };
}

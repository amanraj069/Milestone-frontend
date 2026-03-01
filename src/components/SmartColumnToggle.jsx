import React, { useState, useRef, useEffect } from 'react';

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColumnToggleTrigger({ visibleCount, label, badgeClassName, className, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        className ||
        'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm'
      }
    >
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
        />
      </svg>
      {label || 'Columns'}
      <span className={badgeClassName || 'bg-blue-50 text-blue-600 text-xs font-semibold px-1.5 py-0.5 rounded-full'}>
        {visibleCount}
      </span>
    </button>
  );
}

function ColumnToggleDropdown({ columns, visible, onToggle, onShowAll, onReset, heading, dropdownClassName }) {
  return (
    <div
      className={
        dropdownClassName ||
        'absolute right-0 mt-2 w-64 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden'
      }
    >
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {heading || 'Toggle Columns'}
        </p>
      </div>

      <div className="max-h-64 overflow-y-auto py-1">
        {columns.map((col) => (
          <label
            key={col.key}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={visible.has(col.key)}
              onChange={() => onToggle(col.key)}
              className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 focus:ring-offset-white bg-white"
            />
            <span className="text-sm text-gray-700">{col.label}</span>
          </label>
        ))}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100 flex justify-between">
        <button
          onClick={onShowAll}
          className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
        >
          Show all
        </button>
        <button
          onClick={onReset}
          className="text-xs text-gray-400 hover:text-gray-500 font-medium transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * SmartColumnToggle
 *
 * Props:
 *   columns          – array of { key, label, defaultVisible? }
 *   visible          – Set of currently visible column keys
 *   onChange         – (Set) => void
 *   storageKey?      – localStorage key for persistence
 *   label?           – button label text (default: "Columns")
 *   heading?         – dropdown header text (default: "Toggle Columns")
 *   triggerClassName?    – override trigger button className
 *   dropdownClassName?   – override dropdown container className
 *   badgeClassName?      – override badge className
 */
export default function SmartColumnToggle({
  columns,
  visible,
  onChange,
  storageKey,
  label,
  heading,
  triggerClassName,
  dropdownClassName,
  badgeClassName,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const persist = (next) => {
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify([...next]));
  };

  const toggle = (key) => {
    const next = new Set(visible);
    if (next.has(key)) {
      if (next.size > 1) next.delete(key);
    } else {
      next.add(key);
    }
    onChange(next);
    persist(next);
  };

  const showAll = () => {
    const all = new Set(columns.map((c) => c.key));
    onChange(all);
    persist(all);
  };

  const resetDefaults = () => {
    const defaults = new Set(
      columns.filter((c) => c.defaultVisible !== false).map((c) => c.key)
    );
    onChange(defaults);
    persist(defaults);
  };

  return (
    <div className="relative" ref={ref}>
      <ColumnToggleTrigger
        visibleCount={visible.size}
        label={label}
        badgeClassName={badgeClassName}
        className={triggerClassName}
        onClick={() => setOpen((o) => !o)}
      />

      {open && (
        <ColumnToggleDropdown
          columns={columns}
          visible={visible}
          onToggle={toggle}
          onShowAll={showAll}
          onReset={resetDefaults}
          heading={heading}
          dropdownClassName={dropdownClassName}
        />
      )}
    </div>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSmartColumnToggle(columns, storageKey) {
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

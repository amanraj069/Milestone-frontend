import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';

/**
 * SmartFilter Component
 * Renders a compact chevron trigger and a portal dropdown that can escape
 * parent overflow (so it won't be clipped by table containers).
 */
const SmartFilter = ({
  label,
  data = [],
  field,
  selectedValues = [],
  onFilterChange,
  valueFormatter,
  valueExtractor,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const hoverTimeout = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Click outside closes dropdown
  useEffect(() => {
    const onDocClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // compute portal position when opened
  useLayoutEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      // always place dropdown below the element (do not flip upwards)
      top: `${rect.bottom + 6}px`,
      left: `${rect.left}px`,
      minWidth: `${Math.max(160, rect.width)}px`,
      zIndex: 99999,
      transformOrigin: 'top left',
    });
  }, [isOpen]);

  // get distinct values
  const getDistinctValues = () => {
    const values = new Set();
    data.forEach((item) => {
      let value;
      if (valueExtractor) value = valueExtractor(item);
      else if (field && field.includes('.')) value = field.split('.').reduce((o, k) => o?.[k], item);
      else value = item[field];
      if (value !== undefined && value !== null && value !== '') values.add(value);
    });
    // If this is the approvals status column, ensure standard statuses appear
    if (field === 'approvalStatus') {
      // ensure Approved, Pending, Rejected appear (order matters)
      const ordered = ['Approved', 'Pending', 'Rejected'];
      ordered.forEach((s) => values.add(s));
      // return in the desired order
      return ordered.concat(Array.from(values).filter(v => !ordered.includes(v)));
    }

    return Array.from(values).sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b));
    });
  };

  const distinctValues = getDistinctValues();
  const filteredValues = distinctValues.filter((v) => {
    const disp = valueFormatter ? valueFormatter(v) : String(v);
    return disp.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const toggleValue = (v) => {
    const newSel = selectedValues.includes(v) ? selectedValues.filter((x) => x !== v) : [...selectedValues, v];
    onFilterChange(newSel);
  };
  const selectAll = () => onFilterChange(filteredValues);
  const clearAll = () => onFilterChange([]);

  const hasSelection = selectedValues.length > 0;

  const dropdown = (
    <div
      ref={dropdownRef}
      onMouseEnter={() => clearTimeout(hoverTimeout.current)}
      onMouseLeave={() => (hoverTimeout.current = setTimeout(() => setIsOpen(false), 150))}
      style={dropdownStyle}
      className="bg-white border border-gray-200 rounded-lg shadow-lg max-w-[360px]"
    >
      <div className="p-2 border-b border-gray-200">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={`Search ${label.toLowerCase()}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>
      </div>
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 bg-gray-50">
        <button onClick={selectAll} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Select All</button>
        <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-700 font-medium">Clear</button>
      </div>
      <div className="max-h-48 overflow-y-auto p-1">
        {filteredValues.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500 text-center">No matching values</div>
        ) : (
          filteredValues.map((value, idx) => (
            <label key={idx} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={selectedValues.includes(value)}
                onChange={() => toggleValue(value)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 truncate">{valueFormatter ? valueFormatter(value) : String(value)}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen((s) => !s)}
        className="p-0.5 text-gray-600 hover:text-gray-800 transition-colors relative flex items-center justify-center"
        aria-label={`Filter ${label}`}
        title={`Filter ${label}`}
      >
        {hasSelection && (
          <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{selectedValues.length}</span>
        )}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && ReactDOM.createPortal(dropdown, document.body)}
    </div>
  );
};

export default SmartFilter;

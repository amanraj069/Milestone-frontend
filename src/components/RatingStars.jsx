import React, { useState } from 'react';

export default function RatingStars({ 
  value = 0, 
  onChange, 
  readOnly = false, 
  size = 'w-6 h-6',
  showNumber = true 
}) {
  const [hoverValue, setHoverValue] = useState(0);

  const handleClick = (rating) => {
    if (!readOnly && onChange) {
      onChange(rating);
    }
  };

  const handleKeyDown = (e, rating) => {
    if (readOnly) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(rating);
    } else if (e.key === 'ArrowRight' && rating < 5) {
      e.preventDefault();
      handleClick(rating + 1);
    } else if (e.key === 'ArrowLeft' && rating > 1) {
      e.preventDefault();
      handleClick(rating - 1);
    }
  };

  const displayValue = readOnly ? value : (hoverValue || value);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((rating) => {
        const isFilled = rating <= displayValue;
        const isPartial = !Number.isInteger(displayValue) && 
                         rating === Math.ceil(displayValue) && 
                         rating > Math.floor(displayValue);

        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => !readOnly && setHoverValue(rating)}
            onMouseLeave={() => !readOnly && setHoverValue(0)}
            onKeyDown={(e) => handleKeyDown(e, rating)}
            disabled={readOnly}
            className={`${readOnly ? 'cursor-default' : 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 rounded'} transition-transform hover:scale-110`}
            aria-label={`Rate ${rating} stars`}
            tabIndex={readOnly ? -1 : 0}
          >
            <svg 
              className={`${size} transition-colors`}
              fill={isFilled ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <defs>
                {isPartial && (
                  <linearGradient id={`partial-${rating}`}>
                    <stop offset={`${(displayValue % 1) * 100}%`} stopColor="currentColor" />
                    <stop offset={`${(displayValue % 1) * 100}%`} stopColor="transparent" />
                  </linearGradient>
                )}
              </defs>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                fill={isPartial ? `url(#partial-${rating})` : isFilled ? 'currentColor' : 'none'}
                className={isFilled || isPartial ? 'text-yellow-400' : 'text-gray-300'}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        );
      })}
      {showNumber && value > 0 && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

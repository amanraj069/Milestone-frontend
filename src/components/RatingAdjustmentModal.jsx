import React, { useState, useEffect } from 'react';
import { getBackendBaseUrl } from '../utils/backendBaseUrl';

const RatingAdjustmentModal = ({ isOpen, onClose, user, onSuccess, apiBasePath = '/api/admin' }) => {
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentRating = user?.rating || 4.5;
  const newRating = Math.max(1.0, Math.min(5.0, currentRating + adjustment));

  useEffect(() => {
    if (!isOpen) {
      setAdjustment(0);
      setReason('');
      setError('');
    }
  }, [isOpen]);

  const handleIncrement = () => {
    if (adjustment < 0.5) {
      setAdjustment(Math.round((adjustment + 0.1) * 10) / 10);
    }
  };

  const handleDecrement = () => {
    if (adjustment > -4.0) {
      setAdjustment(Math.round((adjustment - 0.1) * 10) / 10);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate reason
    if (reason.trim().length < 20) {
      setError('Reason must be at least 20 characters');
      return;
    }

    if (reason.trim().length > 500) {
      setError('Reason must not exceed 500 characters');
      return;
    }

    if (adjustment === 0) {
      setError('Please adjust the rating (use + or - buttons)');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${getBackendBaseUrl()}${apiBasePath}/users/${user.userId}/rating`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            adjustment: adjustment,
            reason: reason.trim(),
            complaintId: user.complaintId || null
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.error || 'Failed to adjust rating');
      }
    } catch (err) {
      console.error('Error adjusting rating:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Subtle backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'rgba(15,23,42,0.15)' }}
        onClick={onClose}
      />

      {/* Slide-in drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Adjust Rating</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* User card */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {user?.picture
              ? <img src={user.picture} alt={user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              : <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
            }
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Unknown User'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role || 'User'} &bull; {user?.email || ''}</p>
            </div>
            <div className="ml-auto flex-shrink-0 text-right">
              <p className="text-[10px] text-gray-400">Current</p>
              <p className="text-sm font-bold text-gray-900">{currentRating.toFixed(1)} <span className="text-amber-400">&#9733;</span></p>
            </div>
          </div>

          {/* Adjuster */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">Adjustment</p>
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={adjustment <= -4.0}
                className="w-9 h-9 rounded-md text-base font-bold border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >−</button>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 tabular-nums">
                  {adjustment > 0 ? '+' : ''}{adjustment.toFixed(1)}
                </div>
                <div className="text-[10px] text-gray-400">step: 0.1</div>
              </div>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={adjustment >= 0.5}
                className="w-9 h-9 rounded-md text-base font-bold border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >+</button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">–4.0 (penalty) &nbsp;to&nbsp; +0.5 (bonus)</p>
          </div>

          {/* Preview bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-white rounded-lg">
            <div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">New Rating</p>
              <p className="text-xl font-bold">{newRating.toFixed(1)} <span className="text-amber-400">&#9733;</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Change</p>
              <p className="text-lg font-semibold text-slate-200">{adjustment > 0 ? '+' : ''}{adjustment.toFixed(1)}</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Reason <span className="text-gray-400 font-normal">(required, 20–500 chars)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this adjustment is necessary..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 resize-none"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {reason.length}/500{reason.length < 20 && ` — ${20 - reason.length} more needed`}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">
              {error}
            </div>
          )}
        </form>

        {/* Footer — outside the scrollable form */}
        <div className="border-t border-gray-200 px-5 py-4 flex gap-3 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || adjustment === 0 || reason.length < 20}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Applying…
                </span>
              : 'Apply Adjustment'
            }
          </button>
        </div>
      </div>
    </>
  );
};

export default RatingAdjustmentModal;

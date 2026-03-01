import React, { useState, useEffect } from 'react';

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
        `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000'}${apiBasePath}/users/${user.userId}/rating`,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Adjust User Rating</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              {user?.picture ? (
                <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900 text-sm">{user?.name || 'Unknown User'}</p>
                <p className="text-xs text-gray-500">{user?.role || 'User'} &bull; {user?.email || ''}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Current Rating:</span>
              <span className="font-bold text-gray-900">{currentRating.toFixed(1)} <span className="text-amber-400">&#9733;</span></span>
            </div>
          </div>

          {/* Rating Adjuster */}
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-gray-700 mb-2 block">Adjustment Amount</span>
              <div className="flex items-center gap-4 justify-center bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={adjustment <= -4.0}
                  className={`w-10 h-10 rounded-md font-bold text-lg transition-colors ${
                    adjustment <= -4.0
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  −
                </button>
                
                <div className="text-center min-w-[60px]">
                  <div className={`text-3xl font-bold ${adjustment < 0 ? 'text-red-600' : adjustment > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {adjustment > 0 ? '+' : ''}{adjustment.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1">step: 0.1</div>
                </div>

                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={adjustment >= 0.5}
                  className={`w-10 h-10 rounded-md font-bold text-lg transition-colors ${
                    adjustment >= 0.5
                      ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  +
                </button>
              </div>
              <div className="text-[11px] text-gray-400 text-center mt-1.5">
                Range: -4.0 (severe penalty) to +0.5 (minor bonus)
              </div>
            </label>

            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">New Rating:</p>
                  <p className="text-2xl font-bold text-gray-900">{newRating.toFixed(1)} <span className="text-amber-400">&#9733;</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Change:</p>
                  <p className={`text-lg font-bold ${adjustment < 0 ? 'text-red-600' : adjustment > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {adjustment > 0 ? '+' : ''}{adjustment.toFixed(1)}
                  </p>
                </div>
              </div>
              {newRating <= 1.0 && (
                <p className="text-xs text-amber-600 mt-2 font-medium">Warning: Rating at minimum (1.0)</p>
              )}
              {newRating >= 5.0 && (
                <p className="text-xs text-green-600 mt-2 font-medium">Rating at maximum (5.0)</p>
              )}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block">
              <span className="text-sm font-medium text-gray-700 mb-1.5 block">
                Reason for Adjustment <span className="text-red-500">*</span>
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this rating adjustment is necessary (minimum 20 characters)..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                required
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${reason.length < 20 ? 'text-red-500' : reason.length > 500 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {reason.length}/500 {reason.length < 20 && `(${20 - reason.length} more needed)`}
                </span>
              </div>
            </label>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start gap-2">
              <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || adjustment === 0 || reason.length < 20}
              className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Applying...
                </span>
              ) : (
                'Apply Adjustment'
              )}
            </button>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5">
            <p className="text-xs text-amber-700">
              <strong>Important:</strong> This action will be logged in the audit trail and cannot be undone automatically.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingAdjustmentModal;

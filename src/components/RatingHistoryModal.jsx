import React, { useState, useEffect } from 'react';
import { getBackendBaseUrl } from '../utils/backendBaseUrl';

const RatingHistoryModal = ({ isOpen, onClose, userId, userName, apiBasePath = '/api/admin' }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && userId) {
      fetchHistory();
    }
  }, [isOpen, userId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${getBackendBaseUrl()}${apiBasePath}/users/${userId}/rating-history`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      const data = await response.json();

      if (data.success) {
        setHistory(data.history || []);
      } else {
        setError(data.error || 'Failed to load rating history');
      }
    } catch (err) {
      console.error('Error fetching rating history:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Rating History</h2>
            <p className="text-xs text-gray-400 mt-0.5">{userName}</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <svg className="animate-spin h-8 w-8 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-gray-500">Loading history...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600 font-medium">No Rating Adjustments</p>
              <p className="text-gray-400 text-sm mt-1">This user's rating has never been manually adjusted</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry, index) => (
                <div
                  key={entry._id || index}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900">
                        {entry.adjustment > 0 ? '+' : ''}{entry.adjustment?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-sm text-gray-700">
                        {entry.previousRating?.toFixed(1) || '0.0'} &rarr; {entry.newRating?.toFixed(1) || '0.0'} <span className="text-amber-400">&#9733;</span>
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      entry.adjustment < 0
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {entry.adjustment < 0 ? 'Penalty' : 'Bonus'}
                    </span>
                  </div>

                  {/* Reason */}
                  <p className="text-sm text-gray-600 mb-2">{entry.reason || 'No reason provided'}</p>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      By <span className="text-gray-500 font-medium">{entry.adjustedByName || 'Unknown'}</span> ({entry.adjustedByRole || 'Admin'})
                    </span>
                    <span>{formatDate(entry.createdAt)}</span>
                  </div>

                  {/* Complaint Link */}
                  {entry.relatedComplaintId && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-400">
                        Complaint: <span className="text-gray-500 font-mono">{entry.relatedComplaintId}</span>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-5 py-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default RatingHistoryModal;

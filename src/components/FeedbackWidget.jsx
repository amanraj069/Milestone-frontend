import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import RatingStars from './RatingStars';
import { loadUserFeedbackStats, selectUserFeedbackStats, selectFeedbackLoading } from '../store/slices/feedbackSlice';

// Props: userId, onViewAll (optional callback)
export default function FeedbackWidget({ userId, onViewAll }) {
  const dispatch = useDispatch();
  const stats = useSelector((state) => selectUserFeedbackStats(state, userId));
  const loading = useSelector(selectFeedbackLoading);

  useEffect(() => {
    if (userId) {
      dispatch(loadUserFeedbackStats(userId));
    }
  }, [userId, dispatch]);

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalFeedbacks === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 text-center">
        <div className="text-gray-400 text-3xl mb-2">⭐</div>
        <p className="text-sm text-gray-600">No ratings yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ratings</h3>

      {/* Average Rating */}
      <div className="flex items-center gap-4 mb-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</div>
          <div className="text-xs text-gray-500">out of 5</div>
        </div>
        <div className="flex-1">
          <RatingStars value={stats.averageRating} readOnly size="w-6 h-6" showNumber={false} />
          <p className="text-sm text-gray-600 mt-1">{stats.totalFeedbacks} review{stats.totalFeedbacks !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2 mb-4">
        {[5, 4, 3, 2, 1].map(rating => {
          const count = stats.ratingDistribution?.[rating] || 0;
          const percentage = stats.totalFeedbacks > 0 ? (count / stats.totalFeedbacks) * 100 : 0;

          return (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-sm text-gray-600 w-6">{rating}</span>
              <span className="text-yellow-500">★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-yellow-400 h-full rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      {onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          View All Reviews
        </button>
      )}
    </div>
  );
}

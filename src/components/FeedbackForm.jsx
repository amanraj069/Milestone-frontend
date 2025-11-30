import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import RatingStars from './RatingStars';
import { submitFeedback, clearFeedbackError, selectFeedbackLoading, selectFeedbackError } from '../store/slices/feedbackSlice';

// Props: jobId, toUserId, toRole, onSuccess, onCancel
export default function FeedbackForm({ jobId, toUserId, toRole, counterpartyName, onSuccess, onCancel }) {
  const dispatch = useDispatch();
  const loading = useSelector(selectFeedbackLoading);
  const error = useSelector(selectFeedbackError);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState([]);
  const [anonymous, setAnonymous] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [commentError, setCommentError] = useState('');

  const availableTags = [
    'Communication',
    'Quality',
    'Timeliness',
    'Professionalism',
    'Technical Skills',
    'Problem Solving',
    'Reliability',
    'Flexibility'
  ];

  useEffect(() => {
    if (rating === 0) {
      setRatingError('Please select a rating');
    } else {
      setRatingError('');
    }
  }, [rating]);

  useEffect(() => {
    if (comment.length > 1000) {
      setCommentError(`Comment is too long (${comment.length}/1000 characters)`);
    } else {
      setCommentError('');
    }
  }, [comment]);

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setRatingError('Please select a rating');
      return;
    }

    if (comment.length > 1000) {
      return;
    }

    const feedbackData = {
      jobId,
      toUserId,
      toRole,
      rating,
      comment: comment.trim(),
      tags,
      anonymous
    };

    const result = await dispatch(submitFeedback(feedbackData));

    if (submitFeedback.fulfilled.match(result)) {
      if (onSuccess) onSuccess();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Leave Feedback</h2>
      <p className="text-gray-600 mb-6">
        Share your experience working with {counterpartyName || 'this user'}
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-4">
            <RatingStars value={rating} onChange={setRating} size="w-8 h-8" />
            {rating > 0 && (
              <span className="text-sm text-gray-600">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            )}
          </div>
          {ratingError && <p className="text-sm text-red-600 mt-1">{ratingError}</p>}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Comment (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="4"
            placeholder="Share details about your experience..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none ${
              commentError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <div className="flex justify-between items-center mt-2">
            <p className={`text-sm ${commentError ? 'text-red-600' : 'text-gray-500'}`}>
              {comment.length} / 1000 characters
            </p>
            {commentError && <p className="text-sm text-red-600">{commentError}</p>}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags (Optional)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  tags.includes(tag)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Anonymous */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="anonymous"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="anonymous" className="text-sm text-gray-700">
            Submit feedback anonymously
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !!ratingError || !!commentError || rating === 0}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
}

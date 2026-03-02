import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import RatingStars from './RatingStars';
import { submitFeedback, clearFeedbackError, selectFeedbackLoading, selectFeedbackError } from '../redux/slices/feedbackSlice';

// Props: isOpen, jobId, toUserId, toRole, onSuccess, onCancel
export default function FeedbackForm({ isOpen, jobId, toUserId, toRole, counterpartyName, onSuccess, onCancel }) {
  const dispatch = useDispatch();
  const loading = useSelector(selectFeedbackLoading);
  const error = useSelector(selectFeedbackError);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState([]);
  const [anonymous, setAnonymous] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [commentError, setCommentError] = useState('');

  // Reset form when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setRating(0);
      setComment('');
      setTags([]);
      setAnonymous(false);
      setRatingError('');
      setCommentError('');
    }
  }, [isOpen]);

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

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'rgba(15,23,42,0.15)' }}
        onClick={onCancel}
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
            <h2 className="text-base font-semibold text-gray-900">Leave Feedback</h2>
            <p className="text-xs text-gray-400 mt-0.5">for {counterpartyName || 'this user'}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">

          {error && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-md text-xs text-red-700">{error}</div>
          )}

          {/* Rating */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Rating <span className="text-red-500">*</span>
            </p>
            <div className="flex items-center gap-3">
              <RatingStars value={rating} onChange={setRating} size="w-7 h-7" />
              {rating > 0 && (
                <span className="text-sm font-semibold text-gray-700">{ratingLabels[rating]}</span>
              )}
            </div>
            {ratingError && <p className="text-xs text-red-600 mt-2">{ratingError}</p>}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Comment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share details about your experience..."
              className={`w-full px-3 py-2 border rounded-md text-sm text-gray-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 resize-none ${
                commentError ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {comment.length}/1000{commentError && <span className="text-red-500 ml-2">{commentError}</span>}
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Tags <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    tags.includes(tag)
                      ? 'bg-slate-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Anonymous */}
          <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-700">Submit anonymously</span>
            <button
              type="button"
              onClick={() => setAnonymous(!anonymous)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                anonymous ? 'bg-slate-800' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                anonymous ? 'translate-x-[18px]' : 'translate-x-[2px]'
              }`} />
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-gray-200 px-5 py-4 flex gap-3 bg-white flex-shrink-0">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !!ratingError || !!commentError || rating === 0}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-slate-800 rounded-md hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting…
                </span>
              : 'Submit Feedback'
            }
          </button>
        </div>
      </div>
    </>
  );
}

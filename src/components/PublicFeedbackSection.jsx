import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { graphqlQuery } from '../utils/graphqlClient';
import { getBackendBaseUrl } from '../utils/backendBaseUrl';

const API_BASE_URL = getBackendBaseUrl();

const COMMENT_LIMIT = 180;

const PublicFeedbackSection = ({ userId, userRole, overrideRating }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    fetchPublicFeedback();
  }, [userId]);

  const fetchPublicFeedback = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch feedback stats via REST (no N+1 - uses aggregation)
      // Fetch feedbacks via GraphQL (eliminates N+1 user/job lookups)
      const [statsResponse, feedbackData] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/feedback/public/stats/${userId}`),
        graphqlQuery(`
          query PublicFeedbacks($userId: String!, $limit: Int) {
            publicFeedbacksForUser(userId: $userId, limit: $limit) {
              feedbacks {
                _id
                rating
                comment
                tags
                anonymous
                createdAt
                jobTitle
                fromUser {
                  name
                  picture
                  role
                }
              }
              total
            }
          }
        `, { userId, limit: 5 })
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (feedbackData.publicFeedbacksForUser) {
        setFeedbacks(feedbackData.publicFeedbacksForUser.feedbacks);
      }
    } catch (error) {
      console.error('Error fetching public feedback:', error);
      setError('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <i
        key={i}
        className={`fas fa-star ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      ></i>
    ));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <i className="fas fa-exclamation-triangle text-2xl mb-2"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Reviews & Feedback</h3>
          <p className="text-gray-600 text-sm">
            What others say about this {userRole === 'Employer' ? 'employer' : 'freelancer'}
          </p>
        </div>
        {(stats || overrideRating !== undefined) && (
          <div className="text-right">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center">
                {renderStars(Math.floor(overrideRating !== undefined ? overrideRating : stats.averageRating))}
              </div>
              <span className="font-bold text-lg">{(overrideRating !== undefined ? overrideRating : stats.averageRating).toFixed(1)}</span>
            </div>
            {stats && (
              <p className="text-sm text-gray-600">
                {stats.totalFeedbacks} review{stats.totalFeedbacks !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {feedbacks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <i className="fas fa-comments text-4xl mb-3 text-gray-300"></i>
          <p className="text-lg font-medium">No reviews yet</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {feedbacks.map((feedback) => (
            <div key={feedback._id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    {feedback.fromUser.picture ? (
                      <img
                        src={feedback.fromUser.picture}
                        alt={feedback.fromUser.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <i className="fas fa-user text-gray-400"></i>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{feedback.fromUser.name}</p>
                    <p className="text-sm text-gray-600">{formatDate(feedback.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {renderStars(feedback.rating)}
                  <span className="ml-2 font-medium">{feedback.rating}/5</span>
                </div>
              </div>

              <div className="mb-3">
                {!feedback.anonymous && (
                  <p className="text-sm text-gray-600 mb-1">Worked as: <span className="font-medium">{feedback.jobTitle}</span></p>
                )}
                {feedback.comment && (() => {
                    const expanded = expandedIds.has(feedback._id);
                    const long = feedback.comment.length > COMMENT_LIMIT;
                    const text = long && !expanded
                      ? feedback.comment.slice(0, COMMENT_LIMIT) + '…'
                      : feedback.comment;
                    return (
                      <p className="text-gray-800 leading-relaxed">
                        {text}
                        {long && (
                          <button
                            onClick={() => toggleExpand(feedback._id)}
                            className="ml-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {expanded ? 'Read less' : 'Read more'}
                          </button>
                        )}
                      </p>
                    );
                  })()}
              </div>

              {feedback.tags && feedback.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {feedback.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}


        </div>
      )}
    </div>
  );
};

export default PublicFeedbackSection;
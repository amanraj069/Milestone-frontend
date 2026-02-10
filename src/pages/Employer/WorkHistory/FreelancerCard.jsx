import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectFeedbackEligibility } from '../../../redux/slices/feedbackSlice';

export default function FreelancerCard({ freelancer, onLeaveFeedback }) {
  const navigate = useNavigate();
  const eligibility = useSelector((state) => selectFeedbackEligibility(state, freelancer.jobId));

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const action = freelancer.status === 'left' ? 'Left' : 'Completed';
    if (diffDays === 0) return `${action} 0 days ago`;
    if (diffDays === 1) return `${action} 1 day ago`;
    return `${action} ${diffDays} days ago`;
  };

  const formatCompletionDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleViewProfile = () => {
    navigate(`/freelancer/${freelancer.freelancerId}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-all duration-200 hover:shadow-md">
      <div className="flex items-start gap-5">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          <img
            src={freelancer.picture || '/default-avatar.png'}
            alt={freelancer.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow-sm"
          />
        </div>

        {/* Freelancer Info */}
        <div className="flex-1 min-w-0">
          {/* Top Row: Name, Rating, Buttons, Status */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors truncate">
                {freelancer.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1.5">
                {[...Array(5)].map((_, i) => (
                  <i
                    key={i}
                    className={`fas fa-star text-sm ${
                      i < Math.floor(freelancer.rating) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  ></i>
                ))}
                <span className="text-sm font-medium text-gray-700 ml-1">{freelancer.rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 items-start">
              {eligibility?.canGiveFeedback && (
                <button
                  onClick={() => onLeaveFeedback(freelancer)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md"
                >
                  <i className="fas fa-star mr-2"></i>
                  Leave Feedback
                </button>
              )}
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md">
                <i className="fas fa-comment mr-2"></i>
                Chat
              </button>
              <button
                onClick={handleViewProfile}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium"
              >
                <i className="fas fa-user mr-2"></i>
                Profile
              </button>
            </div>

            {/* Status Badge */}
            <div className="flex-shrink-0">
              <div className={`px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                freelancer.status === 'left' 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {freelancer.status === 'left' ? 'Left Job' : 'Completed'}
              </div>
            </div>
          </div>

          {/* Job Info */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 font-medium mb-1">Worked as:</p>
            <p className="font-semibold text-gray-900">{freelancer.jobTitle}</p>
          </div>

          {/* Completion Date */}
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <i className={`fas ${freelancer.status === 'left' ? 'fa-sign-out-alt text-red-500' : 'fa-calendar-check text-green-500'}`}></i>
              <span className="font-medium">{formatDate(freelancer.completedDate || freelancer.leftDate)}</span>
            </div>
            {(freelancer.completedDate || freelancer.leftDate) && (
              <p className="text-xs text-gray-500 mt-1">
                {freelancer.status === 'left' ? 'Left on:' : 'Finished on:'} {formatCompletionDate(freelancer.completedDate || freelancer.leftDate)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

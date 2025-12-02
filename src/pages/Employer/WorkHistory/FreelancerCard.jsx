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
    <div className="border-2 border-blue-200 rounded-lg p-5 hover:border-blue-500 transition-all hover:shadow-lg">
      <div className="flex items-start gap-4">
        {/* Profile Picture */}
        <div className="flex-shrink-0">
          <img
            src={freelancer.picture || '/default-avatar.png'}
            alt={freelancer.name}
            className="w-16 h-16 rounded-full object-cover border-3 border-blue-500"
          />
        </div>

        {/* Freelancer Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 cursor-pointer">
                {freelancer.name}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <i
                    key={i}
                    className={`fas fa-star text-sm ${
                      i < Math.floor(freelancer.rating) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  ></i>
                ))}
                <span className="text-sm text-gray-600 ml-1">{freelancer.rating.toFixed(1)}</span>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              freelancer.status === 'left' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {freelancer.status === 'left' ? 'Left Job' : 'Completed'}
            </div>
          </div>

          {/* Job Info */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Worked as:</p>
            <p className="font-medium text-gray-800">{freelancer.jobTitle}</p>
          </div>

          {/* Completion Date */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <i className={`fas ${freelancer.status === 'left' ? 'fa-sign-out-alt text-red-600' : 'fa-calendar-check text-green-600'}`}></i>
              {formatDate(freelancer.completedDate)}
            </p>
            {freelancer.completedDate && (
              <p className="text-xs text-gray-500 ml-5">
                {freelancer.status === 'left' ? 'Left on:' : 'Finished on:'} {formatCompletionDate(freelancer.completedDate)}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
              <i className="fas fa-comment mr-2"></i>
              Chat
            </button>
            <button
              onClick={handleViewProfile}
              className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
            >
              <i className="fas fa-user mr-2"></i>
              Profile
            </button>
            {eligibility?.canGiveFeedback && (
              <button
                onClick={() => onLeaveFeedback(freelancer)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <i className="fas fa-star mr-2"></i>
                Leave Feedback
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useChatContext } from '../../../context/ChatContext';
import { selectFeedbackEligibility } from '../../../redux/slices/feedbackSlice';

export default function FreelancerCard({ freelancer, onLeaveFeedback }) {
  const navigate = useNavigate();
  const { openChatWith } = useChatContext();
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

  const handleChat = () => {
    console.log('FreelancerCard - Chat clicked for:', freelancer);
    console.log('FreelancerCard - userId:', freelancer.userId);
    console.log('FreelancerCard - freelancerId:', freelancer.freelancerId);
    
    const chatUserId = freelancer.userId || freelancer.user?.userId || freelancer.freelancerUserId;
    console.log('FreelancerCard - resolved chatUserId:', chatUserId);
    
    if (!chatUserId) {
      console.error('FreelancerCard - No userId found, freelancer object:', freelancer);
      alert('Unable to start chat: User information not available');
      return;
    }
    openChatWith(chatUserId);
  };

  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl p-4 md:p-5 hover:border-blue-300 transition-all duration-200 hover:shadow-md">
      {/* status badge top-right */}
      <div className="absolute top-3 right-3">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
          freelancer.status === 'left'
            ? 'bg-rose-50 text-rose-700 border border-rose-200'
            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        }`}>
          {freelancer.status === 'left' ? 'Left Job' : 'Completed'}
        </span>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-5">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="flex-shrink-0">
            <img
              src={freelancer.picture || '/default-avatar.png'}
              alt={freelancer.name}
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border border-slate-200 shadow-sm"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <button
                  onClick={handleViewProfile}
                  className="text-left text-xl font-semibold text-slate-900 hover:text-blue-700 transition-colors truncate"
                >
                  {freelancer.name}
                </button>
                <div className="flex items-center gap-1.5 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fas fa-star text-sm ${
                        i < Math.floor(freelancer.rating) ? 'text-amber-400' : 'text-gray-300'
                      }`}
                    ></i>
                  ))}
                  <span className="text-sm font-medium text-slate-600 ml-1">{freelancer.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-md bg-slate-100 text-slate-700 text-sm font-medium">
                {freelancer.jobTitle}
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                <i className={`fas ${freelancer.status === 'left' ? 'fa-sign-out-alt text-rose-500' : 'fa-calendar-check text-emerald-500'}`}></i>
                {formatDate(freelancer.completedDate || freelancer.leftDate)}
              </span>
            </div>

            {(freelancer.completedDate || freelancer.leftDate) && (
              <p className="text-xs text-slate-500 mt-2">
                {freelancer.status === 'left' ? 'Left on:' : 'Finished on:'} {formatCompletionDate(freelancer.completedDate || freelancer.leftDate)}
              </p>
            )}
          </div>
        </div>

        {/* action buttons positioned bottom-right */}
        <div className="absolute bottom-6 right-4 flex gap-2">
          {eligibility?.canGiveFeedback && (
            <button
              onClick={() => onLeaveFeedback(freelancer)}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 text-sm font-semibold shadow-sm"
            >
              <i className="fas fa-star mr-2"></i>
              Leave Feedback
            </button>
          )}
          <button
            onClick={handleChat}
            className="inline-flex items-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-all duration-200 text-sm font-semibold shadow-sm"
          >
            <i className="fas fa-comment mr-2"></i>
            Chat
          </button>
        </div>
      </div>
      <div style={{ minHeight: '28px' }}></div>
    </div>
  );
}

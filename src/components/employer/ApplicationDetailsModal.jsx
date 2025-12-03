import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadFeedbacksForUser, selectFeedbacksForUser, selectFeedbackLoading } from '../../redux/slices/feedbackSlice';

const ApplicationDetailsModal = ({ application, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [closing, setClosing] = useState(false);

  // Feedback state
  const freelancerFeedbacks = useSelector((state) => selectFeedbacksForUser(state, application.freelancerUserId));
  const feedbackLoading = useSelector(selectFeedbackLoading);

  useEffect(() => {
    // disable scrolling on body while modal open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    // Load freelancer's feedback when modal opens
    if (application.freelancerUserId) {
      dispatch(loadFeedbacksForUser({ userId: application.freelancerUserId, limit: 10 }));
    }
  }, [application.freelancerUserId, dispatch]);

  const startClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose && onClose();
    }, 200);
  };

  const handleViewProfile = () => {
    const profileId = application.freelancerUserId || application.freelancerId;
    navigate(`/freelancer/${profileId}`);
  };

  const handleViewJob = () => {
    navigate(`/jobs/${application.jobId}`);
  };

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center bg-black/35 backdrop-blur-sm z-[60] transition-opacity duration-220 ${
        closing ? 'animate-[appOverlayOut_180ms_ease-in_forwards]' : 'animate-[appOverlayIn_220ms_ease-out_forwards]'
      }`}
      onClick={startClose}
      style={{
        opacity: closing ? undefined : 0,
      }}
    >
      <div
        className={`w-full max-w-3xl max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-2xl transition-all duration-260 ${
          closing ? 'animate-[appPanelOut_180ms_ease-in_forwards]' : 'animate-[appPanelIn_260ms_ease-out_forwards]'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: closing ? undefined : 'translateY(10px) scale(0.995)',
          opacity: closing ? undefined : 0,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <img
              src={application.freelancerPicture || '/default-avatar.png'}
              alt={application.freelancerName}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-100 shadow-sm"
            />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{application.freelancerName || 'Unknown Applicant'}</h2>
              <p className="text-sm text-gray-500">Candidate Application Details</p>
            </div>
          </div>
          <button 
            onClick={startClose} 
            className="bg-transparent border-none text-gray-600 cursor-pointer p-1.5 rounded-full transition-colors hover:bg-black/6"
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Job Role Applied For */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-600 mb-1 block">
                  <i className="fas fa-briefcase mr-2 text-blue-600"></i>
                  Job Role Applied For
                </label>
                <p className="text-lg font-medium text-gray-800">{application.jobTitle}</p>
              </div>
              <button
                onClick={handleViewJob}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap ml-4"
              >
                <i className="fas fa-external-link-alt mr-2"></i>
                View Job
              </button>
            </div>
          </div>

          {/* Cover Message */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-600 mb-2 block">
              <i className="fas fa-envelope mr-2 text-blue-600"></i>
              Cover Message
            </label>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
              <p className="text-gray-700 whitespace-pre-wrap">
                {application.coverMessage || 'No cover message provided.'}
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">
                <i className="fas fa-envelope mr-2 text-blue-600"></i>
                Email Address
              </label>
              <p className="text-gray-800 font-medium">
                {application.freelancerEmail || 'Not provided'}
              </p>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">
                <i className="fas fa-phone mr-2 text-blue-600"></i>
                Phone Number
              </label>
              <p className="text-gray-800 font-medium">
                {application.freelancerPhone || 'Not provided'}
              </p>
            </div>
          </div>

          {/* Skill Rating */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-600 mb-3 block">
              <i className="fas fa-star mr-2 text-blue-600"></i>
              Skill Rating
            </label>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <i
                    key={star}
                    className={`fas fa-star text-2xl ${
                      star <= (application.skillRating || 0)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  ></i>
                ))}
              </div>
              <span className="text-gray-700 font-medium ml-2">
                {application.skillRating || 'N/A'} / 5
              </span>
            </div>
          </div>

          {/* Application Status */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-600 mb-2 block">
              <i className="fas fa-info-circle mr-2 text-blue-600"></i>
              Application Status
            </label>
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                application.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                application.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                'bg-red-100 text-red-700'
              }`}>
                {application.status}
              </span>
              <span className="text-gray-600 text-sm">
                Applied on {new Date(application.appliedDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>

          {/* Freelancer Feedback */}
          <div className="border border-gray-200 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-600 mb-4 block">
              <i className="fas fa-comments mr-2 text-blue-600"></i>
              Freelancer Feedback & Reviews
            </label>
            {feedbackLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Loading feedback...</p>
              </div>
            ) : freelancerFeedbacks.feedbacks && freelancerFeedbacks.feedbacks.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {freelancerFeedbacks.feedbacks.slice(0, 5).map((feedback, index) => (
                  <div key={feedback._id || index} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                          {feedback.fromUser?.name ? feedback.fromUser.name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">
                            {feedback.fromUser?.name || 'Anonymous'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`fas fa-star text-sm ${
                              star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          ></i>
                        ))}
                        <span className="text-xs text-gray-600 ml-1">({feedback.rating}/5)</span>
                      </div>
                    </div>
                    {feedback.comment && (
                      <p className="text-gray-700 text-sm leading-relaxed mb-2">{feedback.comment}</p>
                    )}
                    {feedback.tags && feedback.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {feedback.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {freelancerFeedbacks.total > 5 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-600">
                      Showing 5 of {freelancerFeedbacks.total} reviews
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <i className="fas fa-comments text-3xl text-gray-300 mb-2"></i>
                <p className="text-gray-500 text-sm">No feedback available yet</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleViewProfile}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
            >
              <i className="fas fa-user mr-2"></i>
              View Full Profile
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>

        {/* Keyframe animations for modal */}
        <style>{`
          @keyframes appOverlayIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes appOverlayOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }
          @keyframes appPanelIn {
            from {
              transform: translateY(12px) scale(0.995);
              opacity: 0;
            }
            to {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
          }
          @keyframes appPanelOut {
            from {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
            to {
              transform: translateY(12px) scale(0.995);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ApplicationDetailsModal;

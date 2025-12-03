import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const JobDetailsModal = ({ job, freelancer, onClose }) => {
  const [closing, setClosing] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const startClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose && onClose();
    }, 200);
  };

  const handleViewProfile = () => {
    navigate(`/freelancer/${freelancer.freelancerId}`);
  };

  const truncateText = (text, maxLength = 200) => {
    if (!text) return '';
    if (text.length <= maxLength || showFullDescription) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center bg-black/35 backdrop-blur-sm z-[60] transition-opacity duration-220 ${
        closing ? 'animate-[appOverlayOut_180ms_ease-in_forwards]' : 'animate-[appOverlayIn_220ms_ease-out_forwards]'
      }`}
      onClick={startClose}
      style={{ opacity: closing ? undefined : 0 }}
    >
      <div
        className={`w-full max-w-[650px] max-h-[90vh] overflow-auto bg-white rounded-2xl shadow-2xl transition-all duration-260 ${
          closing ? 'animate-[appPanelOut_180ms_ease-in_forwards]' : 'animate-[appPanelIn_260ms_ease-out_forwards]'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: closing ? undefined : 'translateY(10px) scale(0.995)',
          opacity: closing ? undefined : 0,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 rounded-t-lg bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Job Details</h2>
            <p className="text-sm text-gray-600 mt-1">{freelancer?.name}'s Assignment</p>
          </div>
          <button 
            onClick={startClose} 
            className="bg-transparent border-none text-gray-600 cursor-pointer p-1.5 rounded-full transition-colors hover:bg-black/6"
            aria-label="Close"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Job Title */}
          <div>
            <label className="text-sm font-semibold text-gray-500 mb-2 block uppercase tracking-wide">
              <i className="fas fa-briefcase mr-2 text-blue-600"></i>
              Job Title
            </label>
            <h3 className="text-xl font-bold text-gray-800">{job?.jobTitle || 'N/A'}</h3>
          </div>

          {/* Job Description */}
          <div>
            <label className="text-sm font-semibold text-gray-500 mb-2 block uppercase tracking-wide">
              <i className="fas fa-file-alt mr-2 text-blue-600"></i>
              Job Description
            </label>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {truncateText(job?.jobDescription, 200)}
              </p>
              {job?.jobDescription && job.jobDescription.length > 200 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                >
                  {showFullDescription ? (
                    <>
                      <i className="fas fa-chevron-up mr-1"></i> Show Less
                    </>
                  ) : (
                    <>
                      <i className="fas fa-chevron-down mr-1"></i> Read More
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Freelancer Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <label className="text-sm font-semibold text-gray-600 mb-3 block">
              <i className="fas fa-user mr-2 text-blue-600"></i>
              Freelancer Information
            </label>
            <div className="flex items-center gap-4">
              <img
                src={freelancer?.picture || '/default-avatar.png'}
                alt={freelancer?.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-blue-200"
              />
              <div>
                <h4 className="font-semibold text-gray-800">{freelancer?.name}</h4>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <i
                      key={i}
                      className={`fas fa-star text-sm ${
                        i < Math.floor(freelancer?.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    ></i>
                  ))}
                  <span className="text-sm text-gray-600 ml-1">
                    {freelancer?.rating?.toFixed(1) || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleViewProfile}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md hover:shadow-lg"
            >
              <i className="fas fa-user mr-2"></i>
              View Profile
            </button>
            <button
              onClick={startClose}
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

export default JobDetailsModal;

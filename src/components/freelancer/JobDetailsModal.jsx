import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const JobDetailsModal = ({ isOpen, onClose, job, onJobLeft, showLeaveButton = true }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 180);
  };

  const handleLeaveJob = async () => {
    if (!window.confirm('Are you sure you want to leave this job? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(
        `${API_BASE_URL}/api/freelancer/active_job/leave/${job.id}`,
        { withCredentials: true }
      );

      if (response.data.message) {
        alert(response.data.message);
        handleClose();
        if (onJobLeft) {
          onJobLeft();
        }
      }
    } catch (error) {
      console.error('Error leaving job:', error);
      alert(error.response?.data?.error || 'Failed to leave job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getMilestoneStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#10b981'; // Green
      case 'in-progress':
        return '#f59e0b'; // Orange
      case 'not-paid':
        return '#6b7280'; // Gray
      default:
        return '#6b7280';
    }
  };

  const getMilestoneStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'not-paid':
        return 'Pending';
      default:
        return status;
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black/35 backdrop-blur-sm flex justify-center items-center z-[60] transition-opacity duration-220 ${
        closing ? 'animate-[appOverlayOut_180ms_ease-in_forwards]' : 'animate-[appOverlayIn_220ms_ease-out_forwards]'
      }`}
      onClick={handleClose}
      style={{ opacity: closing ? undefined : 0 }}
    >
      <div 
        className={`bg-white rounded-2xl w-full max-w-[750px] max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-260 ${
          closing ? 'animate-[appPanelOut_180ms_ease-in_forwards]' : 'animate-[appPanelIn_260ms_ease-out_forwards]'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: closing ? undefined : 'translateY(10px) scale(0.995)',
          opacity: closing ? undefined : 0,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{job.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{job.company}</p>
          </div>
          <button
            className="bg-transparent border-none text-gray-600 cursor-pointer p-1.5 rounded-full transition-colors hover:bg-black/6"
            onClick={handleClose}
            aria-label="Close"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">{/* Job Details Grid */}
          <div>
            <label className="text-sm font-semibold text-gray-500 mb-3 block uppercase tracking-wide">
              <i className="fas fa-info-circle mr-2 text-blue-600"></i>
              Job Details
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold uppercase tracking-wide mb-2">
                  <i className="fas fa-calendar text-blue-600"></i>
                  Started On
                </div>
                <div className="text-base text-gray-800 font-semibold">{job.startDate}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold uppercase tracking-wide mb-2">
                  <i className="fas fa-clock text-blue-600"></i>
                  Duration
                </div>
                <div className="text-base text-gray-800 font-semibold">{job.daysSinceStart} days</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold uppercase tracking-wide mb-2">
                  <i className="fas fa-rupee-sign text-green-600"></i>
                  Budget
                </div>
                <div className="text-base text-green-600 font-bold">{job.price}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold uppercase tracking-wide mb-2">
                  <i className="fas fa-chart-line text-blue-600"></i>
                  Progress
                </div>
                <div className="text-base text-gray-800 font-semibold">{job.progress}%</div>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          {job.tech && job.tech.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-500 mb-3 block uppercase tracking-wide">
                <i className="fas fa-code mr-2 text-blue-600"></i>
                Required Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {job.tech.map((skill, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description Section */}
          <div>
            <label className="text-sm font-semibold text-gray-500 mb-3 block uppercase tracking-wide">
              <i className="fas fa-file-alt mr-2 text-blue-600"></i>
              Job Description
            </label>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {showFullDescription ? (job.description || 'No description available.') : (truncateText(job.description || 'No description available.', 200))}
              </p>
              {job.description && job.description.length > 200 && (
                <button
                  className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                  onClick={() => setShowFullDescription(!showFullDescription)}
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

          {/* Milestones Section */}
          {job.milestones && job.milestones.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-gray-500 mb-3 block uppercase tracking-wide">
                <i className="fas fa-tasks mr-2 text-blue-600"></i>
                Milestones ({job.milestones.length})
              </label>
              <div className="space-y-4">
                {job.milestones.map((milestone, index) => (
                  <div
                    key={milestone.milestoneId || index}
                    className="border-l-4 rounded-lg p-4 bg-gray-50 border border-gray-200 transition-all hover:shadow-md"
                    style={{ borderLeftColor: getMilestoneStatusColor(milestone.status) }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: getMilestoneStatusColor(milestone.status) }}
                      >
                        {getMilestoneStatusText(milestone.status)}
                      </span>
                      {milestone.completionPercentage !== undefined && (
                        <span className="text-sm font-semibold text-gray-600">
                          {milestone.completionPercentage}% Complete
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 font-medium mb-3 leading-relaxed">
                      {milestone.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <i className="fas fa-calendar-alt text-blue-600"></i>
                        <span>Deadline: <span className="font-semibold text-gray-800">{milestone.deadline}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="fas fa-rupee-sign text-green-600"></i>
                        <span>Payment: <span className="font-semibold text-green-600">₹{milestone.payment}</span></span>
                      </div>
                    </div>
                    {milestone.completionPercentage !== undefined && (
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${milestone.completionPercentage}%`,
                            backgroundColor: getMilestoneStatusColor(milestone.status),
                          }}
                        ></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-6 border-t border-gray-100 flex ${showLeaveButton ? 'justify-between' : 'justify-end'} items-center gap-3 bg-gray-50 rounded-b-2xl`}>
          {showLeaveButton && (
            <button
              className="px-6 py-2.5 bg-red-600 text-white border-none rounded-lg font-semibold cursor-pointer transition-all hover:bg-red-700 hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none"
              onClick={handleLeaveJob}
              disabled={loading}
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              {loading ? 'Leaving Job...' : 'Leave Job'}
            </button>
          )}
          <button 
            className="px-6 py-2.5 bg-gray-200 text-gray-700 border-none rounded-lg font-semibold cursor-pointer transition-all hover:bg-gray-300"
            onClick={handleClose}
          >
            Close
          </button>
        </div>

        {/* Keyframe animations */}
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
              transform: translateY(10px) scale(0.995);
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
              transform: translateY(10px) scale(0.995);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default JobDetailsModal;

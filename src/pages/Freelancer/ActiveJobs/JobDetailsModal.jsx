import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './JobDetailsModal.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const JobDetailsModal = ({ isOpen, onClose, job, onJobLeft }) => {
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
    <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={handleClose}>
      <div className={`modal-content ${closing ? 'closing' : ''}`} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2>{job.title}</h2>
            <p className="company-name">{job.company}</p>
          </div>
          <button
            className="leave-job-btn"
            onClick={handleLeaveJob}
            disabled={loading}
          >
            {loading ? 'Leaving...' : 'Leave Job'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Job Details Section */}
          <div className="detail-section">
            <h3>Job Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <i className="fas fa-calendar"></i>
                <div>
                  <span className="detail-label">Started On</span>
                  <span className="detail-value">{job.startDate}</span>
                </div>
              </div>
              <div className="detail-item">
                <i className="fas fa-clock"></i>
                <div>
                  <span className="detail-label">Duration</span>
                  <span className="detail-value">{job.daysSinceStart} days</span>
                </div>
              </div>
              <div className="detail-item">
                <i className="fas fa-money-bill-wave"></i>
                <div>
                  <span className="detail-label">Budget</span>
                  <span className="detail-value">{job.price}</span>
                </div>
              </div>
              <div className="detail-item">
                <i className="fas fa-chart-line"></i>
                <div>
                  <span className="detail-label">Progress</span>
                  <span className="detail-value">{job.progress}% completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          {job.tech && job.tech.length > 0 && (
            <div className="detail-section">
              <h3>Required Skills</h3>
              <div className="skills-container">
                {job.tech.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description Section */}
          <div className="detail-section">
            <h3>Job Description</h3>
            <div className="description-content">
              <p>{showFullDescription ? (job.description || 'No description available.') : (truncateText(job.description || 'No description available.', 200))}</p>
              {job.description && job.description.length > 200 && (
                <button
                  className="see-more-btn-1"
                  onClick={() => setShowFullDescription(!showFullDescription)}
                >
                  {showFullDescription ? 'Show Less' : 'See More'}
                </button>
              )}
            </div>
          </div>

          {/* Milestones Section */}
          {job.milestones && job.milestones.length > 0 && (
            <div className="detail-section">
              <h3>Milestones</h3>
              <div className="milestones-container">
                {job.milestones.map((milestone, index) => (
                  <div
                    key={milestone.milestoneId || index}
                    className="milestone-card"
                    style={{ borderLeftColor: getMilestoneStatusColor(milestone.status) }}
                  >
                    <div className="milestone-header">
                      {/* <span className="milestone-number">MILESTONE {index + 1}</span> */}
                      <span
                        className="milestone-status"
                        style={{ backgroundColor: getMilestoneStatusColor(milestone.status) }}
                      >
                        {getMilestoneStatusText(milestone.status)}
                      </span>
                    </div>
                    <p className="milestone-description">{milestone.description}</p>
                    <div className="milestone-meta">
                      <div className="milestone-meta-item">
                        <i className="fas fa-calendar-alt"></i>
                        <span>Deadline: {milestone.deadline}</span>
                      </div>
                      <div className="milestone-meta-item">
                        <i className="fas fa-rupee-sign"></i>
                        <span>Payment: Rs.{milestone.payment}</span>
                      </div>
                    </div>
                    {milestone.completionPercentage !== undefined && (
                      <div className="milestone-progress">
                        <div className="milestone-progress-bar">
                          <div
                            className="milestone-progress-fill"
                            style={{
                              width: `${milestone.completionPercentage}%`,
                              backgroundColor: getMilestoneStatusColor(milestone.status),
                            }}
                          ></div>
                        </div>
                        <span className="milestone-progress-text">
                          {milestone.completionPercentage}%
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="close-btn" onClick={handleClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;

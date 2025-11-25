import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardPage from '../../../components/DashboardPage';
import JobDetailsModal from './JobDetailsModal';
import './ActiveJobs.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const FreelancerActiveJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActiveJobs();
  }, []);

  const fetchActiveJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/freelancer/active_job/api`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setJobs(response.data.activeJobs || []);
      }
    } catch (error) {
      console.error('Error fetching active jobs:', error);
      setError('Failed to load active jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeeMore = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleChat = (job) => {
    // Navigate to chat page with employer
    alert(`Chat functionality will be implemented soon for ${job.company}`);
  };

  const handleRaiseComplaint = (job) => {
    // Navigate to complaint form with job data
    navigate('/freelancer/complaint', { state: { job } });
  };

  const handleJobLeft = () => {
    // Refresh the jobs list after leaving a job
    fetchActiveJobs();
  };

  const content = (
    <div className="active-jobs-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Active Jobs</h1>
          <p className="page-subtitle">Manage your ongoing projects and track progress</p>
        </div>
        {/* <button className="refresh-btn" onClick={fetchActiveJobs}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button> */}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading active jobs...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Error loading jobs</h3>
          <p>{error}</p>
          <button onClick={fetchActiveJobs} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* No Jobs State */}
      {!loading && !error && jobs.length === 0 && (
        <div className="no-jobs-container">
          <i className="fas fa-briefcase"></i>
          <h3>No active jobs found</h3>
          <p>You don't have any active jobs at the moment.</p>
        </div>
      )}

      {/* Jobs List */}
      {!loading && !error && jobs.length > 0 && (
        <div className="jobs-grid">
          {jobs.map((job) => (
            <div key={job.id} className="job-card">
              {/* Job Top Section */}
              <div className="job-top">
                <div className="job-company-logo">
                  <img
                    src={job.logo}
                    alt={job.company}
                    onError={(e) => {
                      e.target.src = '/assets/company_logo.jpg';
                    }}
                  />
                </div>
                <div className="job-info">
                  <h3 className="job-title">{job.title}</h3>
                  <div className="job-company">{job.company}</div>
                </div>
              </div>

              {/* Skills/Tech Tags */}
              {job.tech && job.tech.length > 0 && (
                <div className="job-tech">
                  {job.tech.slice(0, 4).map((skill, index) => (
                    <span key={index} className="tech-tag">
                      {skill}
                    </span>
                  ))}
                  {job.tech.length > 4 && (
                    <span className="tech-tag more">+{job.tech.length - 4} more</span>
                  )}
                </div>
              )}

              {/* Job Meta Information */}
              <div className="job-meta">
                <div className="job-meta-item">
                  <i className="fas fa-calendar"></i>
                  <span>Started: {job.startDate}</span>
                </div>
                <div className="job-meta-item">
                  <i className="fas fa-clock"></i>
                  <span>{job.daysSinceStart} days</span>
                </div>
                <div className="job-meta-item job-price">
                  <span>{job.price}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="job-progress">
                <div className="progress-label">
                  <span>Milestone Progress</span>
                  <span>{job.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-filled"
                    style={{ width: `${job.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="job-actions">
                <button className="chat-btn" onClick={() => handleChat(job)} title="Chat with Employer">
                  <i className="fas fa-comment"></i>
                  <span>Chat</span>
                </button>
                <button
                  className="complain-btn"
                  onClick={() => handleRaiseComplaint(job)}
                  title="Raise Complaint"
                >
                  <i className="fas fa-exclamation-circle"></i>
                  <span>Raise Complaint</span>
                </button>
                <button className="see-more-btn" onClick={() => handleSeeMore(job)} title="See Details">
                  <i className="fas fa-info-circle"></i>
                  <span>See More</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          job={selectedJob}
          onJobLeft={handleJobLeft}
        />
      )}
    </div>
  );

  return <DashboardPage title="Active Jobs">{content}</DashboardPage>;
};

export default FreelancerActiveJobs;


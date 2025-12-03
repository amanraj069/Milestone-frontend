//activejob 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardPage from '../../../components/DashboardPage';
import JobDetailsModal from './JobDetailsModal';
import { useChatContext } from '../../../context/ChatContext';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const FreelancerActiveJobs = () => {
  const { openChatWith } = useChatContext();
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
    // Open chat with specific employer
    console.log('Chat clicked for employer:', job);
    console.log('Employer userId:', job.employerUserId);
    
    if (job.employerUserId) {
      openChatWith(job.employerUserId);
    } else {
      alert('Unable to start chat: Employer information not available');
    }
  };

  const handleRaiseComplaint = (job) => {
    // Navigate to complaint form with job data
    navigate('/freelancer/complaint', { state: { job } });
  };

  const handleJobLeft = () => {
    // Refresh the jobs list after leaving a job
    fetchActiveJobs();
  };

  return (
    <DashboardPage title="Active Jobs">
      <p className="text-gray-500 -mt-6 mb-6">Manage your ongoing projects</p>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Your Active Jobs</h2>
          <p className="text-sm text-gray-500 mt-0.5">Jobs currently in progress</p>
        </div>
        <div className="p-6">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
              <p className="text-gray-500">Loading active jobs...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-red-600 mb-2">Error loading jobs</p>
              <p className="text-gray-500 mb-4">{error}</p>
              <button onClick={fetchActiveJobs} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                Retry
              </button>
            </div>
          )}

          {/* No Jobs State */}
          {!loading && !error && jobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg font-medium text-gray-700 mb-1">No active jobs found</p>
              <p className="text-gray-500">You don't have any active jobs at the moment.</p>
            </div>
          )}

          {/* Jobs List */}
          {!loading && !error && jobs.length > 0 && (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="p-4">
                    {/* Job Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                        <img
                          src={job.logo}
                          alt={job.company}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/assets/company_logo.jpg';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{job.title}</h3>
                        <p className="text-sm text-gray-600 mt-0.5">{job.company}</p>
                      </div>
                    </div>

                    {/* Skills/Tech Tags */}
                    {job.tech && job.tech.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.tech.slice(0, 4).map((skill, index) => (
                          <span key={index} className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {skill}
                          </span>
                        ))}
                        {job.tech.length > 4 && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-600">
                            +{job.tech.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Job Meta Information */}
                    <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-gray-500">
                      <span>Started: {job.startDate}</span>
                      <span className="text-gray-300">•</span>
                      <span>{job.daysSinceStart} days</span>
                      <span className="text-gray-300">•</span>
                      <span className="font-medium text-gray-900">{job.price}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-medium text-gray-600">Milestone Progress</span>
                        <span className="text-xs font-medium text-gray-900">{job.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button 
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors" 
                        onClick={() => handleChat(job)}
                      >
                        Chat
                      </button>
                      <button
                        className="px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
                        onClick={() => handleRaiseComplaint(job)}
                      >
                        Raise Complaint
                      </button>
                      <button 
                        className="px-3 py-1.5 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors" 
                        onClick={() => handleSeeMore(job)}
                      >
                        See More
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          job={selectedJob}
          onJobLeft={handleJobLeft}
        />
      )}
    </DashboardPage>
  );
};

export default FreelancerActiveJobs;


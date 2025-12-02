import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardPage from '../../../components/DashboardPage';
import JobDetailsModal from './JobDetailsModal';
import { useChatContext } from '../../../context/ChatContext';
import './ActiveJobs.css';

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

  // Calculate stats
  const stats = {
    total: jobs.length,
    avgDays: jobs.length > 0 ? Math.round(jobs.reduce((sum, j) => sum + (j.daysSinceStart || 0), 0) / jobs.length) : 0,
    totalEarnings: jobs.reduce((sum, j) => {
      const price = parseFloat(String(j.price).replace(/[^0-9.]/g, '')) || 0;
      return sum + price;
    }, 0),
    avgProgress: jobs.length > 0 ? Math.round(jobs.reduce((sum, j) => sum + (j.progress || 0), 0) / jobs.length) : 0
  };

  const [searchTerm, setSearchTerm] = useState('');
  const filteredJobs = jobs.filter(job =>
    job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.tech?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <p className="text-gray-600">Track your current job projects and progress</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">{stats.total}</div>
          <div className="text-gray-600 text-sm">Active Jobs</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">{stats.avgDays}</div>
          <div className="text-gray-600 text-sm">Days Average</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">₹{stats.totalEarnings.toLocaleString()}</div>
          <div className="text-gray-600 text-sm">Total Earnings</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">{stats.avgProgress}%</div>
          <div className="text-gray-600 text-sm">Avg Progress</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Find active jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            <i className="fas fa-search"></i>
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-xl shadow-md p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading active jobs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <i className="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error loading jobs</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button onClick={fetchActiveJobs} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Retry
            </button>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-briefcase text-gray-400 text-5xl mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {searchTerm ? 'No matching jobs found' : 'No active jobs found'}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search criteria' : 'You don\'t have any active jobs at the moment.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between gap-6">
                  {/* Left: Company Logo & Job Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0">
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
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                      <p className="text-gray-600 font-medium mb-3">{job.company}</p>
                      
                      {/* Tech Stack */}
                      {job.tech && job.tech.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.tech.slice(0, 6).map((skill, index) => (
                            <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
                              {skill}
                            </span>
                          ))}
                          {job.tech.length > 6 && (
                            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">+{job.tech.length - 6} more</span>
                          )}
                        </div>
                      )}

                      {/* Job Meta */}
                      <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <i className="fas fa-calendar text-blue-600"></i>
                          <span>Started: {job.startDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-clock text-blue-600"></i>
                          <span>{job.daysSinceStart} days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <i className="fas fa-money-bill-wave text-green-600"></i>
                          <span className="font-semibold text-green-600">{job.price}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Progress & Actions */}
                  <div className="flex flex-col items-end gap-4 min-w-[200px]">
                    {/* Progress */}
                    <div className="w-full">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium">Milestone Progress</span>
                        <span className="font-bold text-blue-600">{job.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={() => handleChat(job)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                        title="Chat with Employer"
                      >
                        <i className="fas fa-comment mr-2"></i>
                        Chat
                      </button>
                      <button
                        onClick={() => handleRaiseComplaint(job)}
                        className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-semibold"
                        title="Raise Complaint"
                      >
                        <i className="fas fa-exclamation-circle mr-2"></i>
                        Complain
                      </button>
                    </div>
                    <button
                      onClick={() => handleSeeMore(job)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                      title="See Details"
                    >
                      <i className="fas fa-info-circle mr-2"></i>
                      See More
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
    </div>
  );

  return <DashboardPage title="Active Jobs">{content}</DashboardPage>;
};

export default FreelancerActiveJobs;


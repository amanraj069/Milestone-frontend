import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardPage from '../../../components/DashboardPage';
import JobDetailsModal from '../../../components/freelancer/JobDetailsModal';
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
      <p className="text-gray-500 mb-6 -mt-4">Track your current job projects and progress</p>

      {/* Stats Cards - Transaction Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <i className="fas fa-briefcase text-blue-600 text-xl"></i>
            </div>
            <div>
              <div className="text-sm text-gray-500">Active Jobs</div>
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
              <i className="fas fa-rupee-sign text-green-600 text-xl"></i>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Earnings</div>
              <div className="text-2xl font-bold text-gray-900">₹{stats.totalEarnings.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
              <i className="fas fa-clock text-amber-600 text-xl"></i>
            </div>
            <div>
              <div className="text-sm text-gray-500">Days Average</div>
              <div className="text-2xl font-bold text-gray-900">{stats.avgDays}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
              <i className="fas fa-chart-line text-purple-600 text-xl"></i>
            </div>
            <div>
              <div className="text-sm text-gray-500">Avg Progress</div>
              <div className="text-2xl font-bold text-gray-900">{stats.avgProgress}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search by job title, company, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-briefcase text-gray-400 text-5xl mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No active jobs found</h3>
            <p className="text-gray-600">You don't have any active jobs at the moment.</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-search text-gray-400 text-5xl mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No matching jobs found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1.5fr_1.2fr_0.8fr_1fr_1fr] gap-4 px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Employer</div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Job Details</div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Milestone Progress</div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Chat</div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Detailed Info</div>
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {filteredJobs.map((job, index) => (
                <div 
                  key={job.id} 
                  className={`grid grid-cols-[2fr_1.5fr_1.2fr_0.8fr_1fr_1fr] gap-4 px-6 py-5 hover:bg-blue-50/50 transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
                >
                  {/* Employer Column */}
                  <div className="flex items-center gap-3">
                    <img
                      src={job.logo}
                      alt={job.company}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        e.target.src = '/assets/company_logo.jpg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{job.title}</div>
                      <div className="text-sm text-gray-500 truncate">{job.company}</div>
                      {job.tech && job.tech.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          {job.tech.slice(0, 2).map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                              {skill}
                            </span>
                          ))}
                          {job.tech.length > 2 && (
                            <span className="text-xs text-gray-500 font-medium">+{job.tech.length - 2} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Job Details Column */}
                  <div className="flex flex-col justify-center gap-1 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <i className="fas fa-calendar text-blue-600 w-4"></i>
                      <span className="text-xs text-gray-500">Started:</span>
                      <span className="font-medium">{job.startDate}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <i className="fas fa-clock text-amber-600 w-4"></i>
                      <span className="font-medium">{job.daysSinceStart} days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-rupee-sign text-green-600 w-4"></i>
                      <span className="font-semibold text-green-600">{job.price}</span>
                    </div>
                  </div>

                  {/* Milestone Progress Column */}
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-500 font-medium">Progress</span>
                      <span className="text-sm font-bold text-blue-600">{job.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${job.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Chat Column */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleChat(job)}
                      className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                      title="Chat with Employer"
                    >
                      <i className="fas fa-comment"></i>
                      <span>Chat</span>
                    </button>
                  </div>

                  {/* Detail Info Column */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleSeeMore(job)}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                      title="See Details"
                    >
                      <i className="fas fa-eye"></i>
                      <span>See More</span>
                    </button>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => handleRaiseComplaint(job)}
                      className="w-full px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                      title="Raise Complaint"
                    >
                      <i className="fas fa-exclamation-circle"></i>
                      <span>Complain</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
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


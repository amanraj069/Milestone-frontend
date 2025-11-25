import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardPage from '../../../components/DashboardPage';
import JobDetailsModal from './JobDetailsModal';
import RatingModal from './RatingModal';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const EmployerCurrentJobs = () => {
  const navigate = useNavigate();
  const [freelancers, setFreelancers] = useState([]);
  const [filteredFreelancers, setFilteredFreelancers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    avgRating: 0,
    avgDays: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    fetchCurrentFreelancers();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFreelancers(freelancers);
    } else {
      const filtered = freelancers.filter(f =>
        f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFreelancers(filtered);
    }
  }, [searchTerm, freelancers]);

  const fetchCurrentFreelancers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/employer/current-freelancers`, {
        withCredentials: true
      });

      if (response.data.success) {
        setFreelancers(response.data.data.freelancers);
        setFilteredFreelancers(response.data.data.freelancers);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching current freelancers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSeeMore = (freelancer) => {
    setSelectedJob(freelancer);
    setSelectedFreelancer(freelancer);
    setShowJobModal(true);
  };

  const handleRateFreelancer = (freelancer) => {
    setSelectedFreelancer(freelancer);
    setShowRatingModal(true);
  };

  const handleRatingSuccess = () => {
    fetchCurrentFreelancers();
  };

  const handleRaiseComplaint = (freelancer) => {
    // Navigate to complaint form with freelancer data
    navigate('/employer/complaint', { state: { freelancer } });
  };

  const formatDays = (days) => {
    if (days === 0) return 'Since 0 days';
    if (days === 1) return 'Since 1 day';
    return `Since ${days} days`;
  };

  return (
    <DashboardPage title="Current Jobs">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Current Jobs</h1>
          <p className="text-gray-600">Track freelancers currently working on your projects</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{stats.total}</div>
            <div className="text-gray-600 text-sm">Active Freelancers</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{stats.avgRating}</div>
            <div className="text-gray-600 text-sm">Average Rating</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{stats.avgDays}</div>
            <div className="text-gray-600 text-sm">Days Average</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{stats.successRate}%</div>
            <div className="text-gray-600 text-sm">Success Rate</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 max-w-lg">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Find specific skills..."
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

        {/* Freelancers List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading freelancers...</p>
            </div>
          ) : filteredFreelancers.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-users text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-600">
                {searchTerm ? 'No freelancers found matching your search' : 'No active freelancers at the moment'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFreelancers.map((freelancer) => (
                <div
                  key={`${freelancer.freelancerId}-${freelancer.jobId}`}
                  className="border-2 border-gray-200 rounded-lg p-5 hover:border-blue-500 transition-all hover:shadow-lg"
                >
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
                        <button
                          onClick={() => handleRaiseComplaint(freelancer)}
                          className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                        >
                          Raise Complaint
                        </button>
                      </div>

                      {/* Job Info */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Working on:</p>
                        <p className="font-medium text-gray-800">{freelancer.jobTitle}</p>
                      </div>

                      {/* Since Date */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <i className="fas fa-calendar-alt text-blue-600"></i>
                          {formatDays(freelancer.daysSinceStart)}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleSeeMore(freelancer)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <i className="fas fa-eye mr-2"></i>
                          See More
                        </button>
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                          <i className="fas fa-comment mr-2"></i>
                          Chat
                        </button>
                        {freelancer.hasRated ? (
                          <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
                            <i className="fas fa-check-circle"></i>
                            Rated: {freelancer.employerRating} <i className="fas fa-star text-yellow-500 ml-1"></i>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRateFreelancer(freelancer)}
                            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                          >
                            <i className="fas fa-star mr-2"></i>
                            Rate Freelancer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      {showJobModal && selectedJob && selectedFreelancer && (
        <JobDetailsModal
          job={selectedJob}
          freelancer={selectedFreelancer}
          onClose={() => {
            setShowJobModal(false);
            setSelectedJob(null);
            setSelectedFreelancer(null);
          }}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedFreelancer && (
        <RatingModal
          freelancer={selectedFreelancer}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedFreelancer(null);
          }}
          onSuccess={handleRatingSuccess}
        />
      )}
    </DashboardPage>
  );
};

export default EmployerCurrentJobs;

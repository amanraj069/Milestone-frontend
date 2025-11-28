import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardPage from '../../../components/DashboardPage';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const EmployerWorkHistory = () => {
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkHistory();
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

  const fetchWorkHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/employer/work-history`, {
        withCredentials: true
      });

      if (response.data.success) {
        setFreelancers(response.data.data.freelancers);
        setFilteredFreelancers(response.data.data.freelancers);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching work history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (freelancerId) => {
    navigate(`/freelancer/${freelancerId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Completed 0 days ago';
    if (diffDays === 1) return 'Completed 1 day ago';
    return `Completed ${diffDays} days ago`;
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

  return (
    <DashboardPage title="Work History">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          {/* <h1 className="text-2xl font-bold text-gray-800 mb-2">Work History</h1> */}
          <p className="text-gray-600">View freelancers who have previously worked on your projects</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{stats.total}</div>
            <div className="text-gray-600 text-sm">Completed Projects</div>
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
                placeholder="Search freelancers, projects..."
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
              <p className="mt-4 text-gray-600">Loading work history...</p>
            </div>
          ) : filteredFreelancers.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-history text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-600">
                {searchTerm ? 'No freelancers found matching your search' : 'No work history available'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFreelancers.map((freelancer) => (
                <div
                  key={`${freelancer.freelancerId}-${freelancer.jobId}`}
                  className="border-2 border-blue-200 rounded-lg p-5 hover:border-blue-500 transition-all hover:shadow-lg"
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
                        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          Completed
                        </div>
                      </div>

                      {/* Job Info */}
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Worked on:</p>
                        <p className="font-medium text-gray-800">{freelancer.jobTitle}</p>
                      </div>

                      {/* Completion Date */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <i className="fas fa-calendar-check text-green-600"></i>
                          {formatDate(freelancer.completedDate)}
                        </p>
                        {freelancer.completedDate && (
                          <p className="text-xs text-gray-500 ml-5">
                            Finished on: {formatCompletionDate(freelancer.completedDate)}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                          <i className="fas fa-comment mr-2"></i>
                          Chat
                        </button>
                        <button
                          onClick={() => handleViewProfile(freelancer.freelancerId)}
                          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                        >
                          <i className="fas fa-user mr-2"></i>
                          Profile
                        </button>
                        {freelancer.employerRating && (
                          <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-2">
                            <i className="fas fa-star text-yellow-500"></i>
                            Rated: {freelancer.employerRating}/5
                          </div>
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
    </DashboardPage>
  );
};

export default EmployerWorkHistory;

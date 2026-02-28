import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Footer from '../../components/Home/Footer';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const JobApplicants = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth?.user;
  const getDashboardRoute = auth?.getDashboardRoute;
  
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [filteredApplicants, setFilteredApplicants] = useState([]);
  const [error, setError] = useState(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');

  useEffect(() => {
    fetchApplicants();
  }, [jobId]);

  // Filter and sort applicants
  useEffect(() => {
    let filtered = [...applicants];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(search) ||
        app.email.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredApplicants(filtered);
  }, [applicants, statusFilter, searchTerm, sortBy]);

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/applicants`, {
        credentials: 'include',
      });
      const data = await response.json();
      
      if (data.success) {
        setJob(data.job);
        setApplicants(data.applicants);
      } else {
        setError(data.error || 'Failed to fetch applicants');
      }
    } catch (error) {
      console.error('Failed to load applicants:', error);
      setError('Failed to load applicants');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (freelancerId) => {
    navigate(`/freelancer/${freelancerId}`);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || statusColors.pending;
  };

  // Calculate statistics
  const getStatistics = () => {
    return {
      total: applicants.length,
      pending: applicants.filter(a => a.status === 'pending').length,
      accepted: applicants.filter(a => a.status === 'accepted').length,
      rejected: applicants.filter(a => a.status === 'rejected').length,
    };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading applicants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="text-4xl font-bold text-gray-900">
              <Link to="/" className="hover:text-blue-700 transition-colors">
                Mile<span className="text-blue-700">stone</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <Link
                  to={getDashboardRoute()}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white rounded-lg font-medium no-underline transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <i className="fas fa-tachometer-alt"></i>
                  Dashboard
                </Link>
              ) : (
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white rounded-lg font-medium no-underline transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Page Heading */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Job Applicants</h1>
        {job && <p className="text-lg text-gray-600 mt-2">{job.title}</p>}
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Total Applicants Stats */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Total Applicants</h2>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total}</p>
            </div>
            <div className="text-blue-600 text-5xl">
              <i className="fas fa-users"></i>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-search mr-2"></i>Search
              </label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-filter mr-2"></i>Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-sort mr-2"></i>Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Latest First</option>
                <option value="rating">Highest Rating</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-800">{filteredApplicants.length}</span> of <span className="font-semibold text-gray-800">{applicants.length}</span> applicants
            </p>
          </div>
        </div>

        {/* Applicants List */}
        {filteredApplicants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">
              <i className="fas fa-user-slash"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {applicants.length === 0 ? 'No Applicants Yet' : 'No Matching Applicants'}
            </h3>
            <p className="text-gray-600">
              {applicants.length === 0 
                ? "This job hasn't received any applications yet." 
                : 'Try adjusting your filters to see more results.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplicants.map((applicant) => (
              <div
                key={applicant.applicationId}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-all border-2 border-gray-200 hover:border-blue-600"
              >
                <div className="flex gap-6">
                  {/* Profile Picture */}
                  <div className="flex-shrink-0">
                    <img
                      src={applicant.picture || '/assets/default-avatar.png'}
                      alt={applicant.name}
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  </div>

                  {/* Applicant Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{applicant.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-yellow-500">
                            <i className="fas fa-star text-sm"></i>
                            <span className="text-sm font-medium text-gray-700">
                              {applicant.rating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600">{applicant.email}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(applicant.status)}`}>
                        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                      </span>
                    </div>

                    {/* Cover Message */}
                    {applicant.coverMessage && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Cover Message:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          {applicant.coverMessage}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mt-4">
                      <button
                        onClick={() => handleViewProfile(applicant.freelancerId)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium"
                      >
                        <i className="fas fa-user mr-2"></i>
                        View Profile
                      </button>
                      {applicant.resumeLink && (
                        <a
                          href={`${API_BASE_URL}${applicant.resumeLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all font-medium"
                        >
                          <i className="fas fa-file-pdf mr-2"></i>
                          View Resume
                        </a>
                      )}
                      <span className="text-sm text-gray-600 ml-auto">
                        Applied on {formatDate(applicant.appliedDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default JobApplicants;

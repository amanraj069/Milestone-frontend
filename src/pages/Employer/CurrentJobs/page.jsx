import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardPage from '../../../components/DashboardPage';
import JobDetailsModal from '../../../components/employer/JobDetailsModal';
import SmartFilter from '../../../components/SmartFilter';
import { useChatContext } from '../../../context/ChatContext';
import { graphqlRequest } from '../../../utils/graphqlClient';

const EMPLOYER_CURRENT_FREELANCERS_QUERY = `
  query EmployerCurrentFreelancers(
    $search: String
    $sortBy: String
    $page: Int
    $limit: Int
    $nameIn: [String]
    $jobRoleIn: [String]
  ) {
    employerCurrentFreelancers(
      search: $search
      sortBy: $sortBy
      page: $page
      limit: $limit
      nameIn: $nameIn
      jobRoleIn: $jobRoleIn
    ) {
      freelancers {
        freelancerId
        userId
        name
        email
        phone
        picture
        rating
        jobId
        jobTitle
        jobDescription
        startDate
        daysSinceStart
        hasRated
        employerRating
      }
      stats {
        total
        avgRating
        avgDays
        successRate
      }
      pagination {
        page
        limit
        total
        totalPages
        hasNextPage
        hasPrevPage
      }
      filterOptions {
        names
        jobRoles
      }
    }
  }
`;

const mergeUniqueValues = (existing = [], incoming = []) => {
  const seen = new Set();
  const merged = [];

  [...existing, ...incoming].forEach((value) => {
    if (value === undefined || value === null || value === '') return;
    const key = String(value);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(value);
  });

  return merged;
};

const EmployerCurrentJobs = () => {
  const navigate = useNavigate();
  const { openChatWith } = useChatContext();
  const [freelancers, setFreelancers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [filterOptions, setFilterOptions] = useState({ names: [], jobRoles: [] });
  const [stats, setStats] = useState({
    total: 0,
    avgRating: 0,
    avgDays: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating-high-low');
  const [nameFilters, setNameFilters] = useState([]);
  const [jobRoleFilters, setJobRoleFilters] = useState([]);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const inFlightRef = useRef('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const querySignature = JSON.stringify({
    debouncedSearchTerm,
    sortBy,
    nameFilters,
    jobRoleFilters,
    currentPage,
    pageSize,
  });

  useEffect(() => {
    fetchCurrentFreelancers();
  }, [querySignature]);

  const fetchCurrentFreelancers = async () => {
    const variables = {
      search: debouncedSearchTerm || null,
      sortBy,
      page: currentPage,
      limit: pageSize,
      nameIn: nameFilters.length ? nameFilters : null,
      jobRoleIn: jobRoleFilters.length ? jobRoleFilters : null,
    };

    // Deduplicate in-flight requests 
    const requestKey = JSON.stringify(variables);
    if (inFlightRef.current === requestKey) return;

    try {
      setLoading(true);
      inFlightRef.current = requestKey;

      const data = await graphqlRequest({
        query: EMPLOYER_CURRENT_FREELANCERS_QUERY,
        variables,
      });

      const payload = data?.employerCurrentFreelancers;
      if (payload) {
        setFreelancers(payload.freelancers || []);
        setPagination(payload.pagination || {
          page: currentPage,
          limit: pageSize,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
        const incomingFilters = payload.filterOptions || { names: [], jobRoles: [] };
        setFilterOptions((prev) => ({
          names: mergeUniqueValues(prev.names, incomingFilters.names || []),
          jobRoles: mergeUniqueValues(prev.jobRoles, incomingFilters.jobRoles || []),
        }));
        setStats(payload.stats || { total: 0, avgRating: 0, avgDays: 0, successRate: 0 });
      }
    } catch (error) {
      console.error('Error fetching current freelancers:', error);
    } finally {
      inFlightRef.current = '';
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  const handleSeeMore = (freelancer) => {
    setSelectedJob(freelancer);
    setSelectedFreelancer(freelancer);
    setShowJobModal(true);
  };

  const handleChat = (freelancer) => {
    if (!freelancer.userId) {
      console.error('No userId found for freelancer:', freelancer);
      alert('Error: Unable to start chat. User ID not found.');
      return;
    }

    openChatWith(freelancer.userId);
  };

  const handleRaiseComplaint = (freelancer) => {
    navigate('/employer/complaint', { state: { freelancer } });
  };

  const formatDays = (startOrDays) => {
    // If a number of days was passed, use it directly
    if (typeof startOrDays === 'number' && !Number.isNaN(startOrDays)) {
      const days = Math.max(0, Math.floor(startOrDays));
      if (days === 0) return 'Since 0 days';
      if (days === 1) return 'Since 1 day';
      return `Since ${days} days`;
    }

    // If a date string/object was passed, compute days since that date
    const dateVal = startOrDays || null;
    const parsed = dateVal ? new Date(dateVal) : null;
    if (parsed && !Number.isNaN(parsed.getTime())) {
      const now = new Date();
      // difference in full days
      const diffMs = now.setHours(0, 0, 0, 0) - parsed.setHours(0, 0, 0, 0);
      const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      if (diffDays === 0) return 'Since 0 days';
      if (diffDays === 1) return 'Since 1 day';
      return `Since ${diffDays} days`;
    }

    return 'Since N/A';
  };

  return (
    <DashboardPage title="Current Jobs">
      <div className="space-y-6">
        {/* Header */}
        <p className="text-gray-600">Track freelancers currently working on your projects</p>

        {/* Stats Cards - Transaction Page Style */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-users text-blue-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Active Freelancers</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-star text-yellow-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Average Rating</p>
                <p className="text-2xl font-bold text-gray-800">{stats.avgRating}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-calendar-alt text-purple-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Days Average</p>
                <p className="text-2xl font-bold text-gray-800">{stats.avgDays}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Success Rate</p>
                <p className="text-2xl font-bold text-gray-800">{stats.successRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setSearchTerm(e.target.value);
                  }}
                  placeholder="Search by freelancer name or job role..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={sortBy}
              onChange={(e) => {
                setCurrentPage(1);
                setSortBy(e.target.value);
              }}
              className="h-9 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Sort current jobs"
            >
              <option value="rating-high-low">Rating High-Low</option>
              <option value="rating-low-high">Rating Low-High</option>
              <option value="working-since-oldest">Working Since Oldest First</option>
              <option value="working-since-newest">Working Since Newest First</option>
              <option value="name-a-z">Name A-Z</option>
              <option value="name-z-a">Name Z-A</option>
            </select>
          </div>
        </div>

        {/* Freelancers List - Table Layout */}
        {!hasLoadedOnce ? (
          <div className="bg-white rounded-xl shadow-md">
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading freelancers...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-[480px]">
            {loading ? (
              <div className="text-center py-8 flex-grow flex flex-col justify-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading freelancers...</p>
              </div>
            ) : freelancers.length === 0 ? (
              <div className="text-center py-8 flex-grow flex flex-col justify-center">
                <i className="fas fa-users text-6xl text-gray-300 mb-4"></i>
                <p className="text-gray-600">
                  {searchTerm ? 'No freelancers found matching your search' : 'No active freelancers at the moment'}
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-auto flex-grow">
                  <table className="min-w-full">
                    <thead className="sticky top-0 z-10 bg-white shadow-sm">
                      <tr className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <span>Freelancer</span>
                            <SmartFilter
                              label="Name"
                              data={freelancers}
                              valueExtractor={(it) => it.name || ''}
                              selectedValues={nameFilters}
                              onFilterChange={(values) => {
                                setCurrentPage(1);
                                setNameFilters(values);
                              }}
                              options={filterOptions.names || []}
                            />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            <span>Job Details</span>
                            <SmartFilter
                              label="Job Role"
                              data={freelancers}
                              valueExtractor={(it) => it.jobTitle}
                              selectedValues={jobRoleFilters}
                              onFilterChange={(values) => {
                                setCurrentPage(1);
                                setJobRoleFilters(values);
                              }}
                              options={filterOptions.jobRoles || []}
                            />
                          </div>
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Chat
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                          Role Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {freelancers.map((freelancer) => (
                        <tr
                          key={`${freelancer.freelancerId}-${freelancer.jobId}`}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {/* Freelancer Column */}
                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                {freelancer.picture ? (
                                  <img
                                    className="h-12 w-12 rounded-full object-cover border-2 border-blue-500 shadow-md"
                                    src={freelancer.picture}
                                    alt={freelancer.name}
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                                    {freelancer.name?.charAt(0)?.toUpperCase() || 'F'}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {freelancer.name}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  {[...Array(5)].map((_, i) => (
                                    <i
                                      key={i}
                                      className={`fas fa-star text-xs ${i < Math.floor(freelancer.rating) ? 'text-yellow-400' : 'text-gray-300'
                                        }`}
                                    ></i>
                                  ))}
                                  <span className="text-xs text-gray-600 ml-1">{Number(freelancer.rating || 0).toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Job Details Column */}
                          <td className="px-6 py-5">
                            <div className="text-sm font-semibold text-gray-900 mb-1">
                              {freelancer.jobTitle}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <i className="fas fa-calendar-alt text-blue-600 mr-2"></i>
                              {formatDays(freelancer.startDate || freelancer.daysSinceStart)}
                            </div>
                          </td>

                          {/* Chat Column */}
                          <td className="px-6 py-5 text-center">
                            <button
                              onClick={() => handleChat(freelancer)}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              <i className="fas fa-comment mr-2"></i>
                              Chat
                            </button>
                          </td>

                          {/* Action Column */}
                          <td className="px-6 py-5 text-center">
                            <button
                              onClick={() => handleRaiseComplaint(freelancer)}
                              className="inline-flex items-center px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              <i className="fas fa-exclamation-triangle mr-2"></i>
                              Raise Complaint
                            </button>
                          </td>

                          {/* Role Details Column */}
                          <td className="px-6 py-5 text-center">
                            <button
                              onClick={() => handleSeeMore(freelancer)}
                              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                              <i className="fas fa-eye mr-2"></i>
                              See More
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 mt-auto">
                  <p className="text-xs text-gray-500">Showing {freelancers.length} of {pagination.total} records</p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-500">Rows:</label>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setCurrentPage(1);
                        setPageSize(Math.min(100, Math.max(1, Number(e.target.value) || 25)));
                      }}
                      className="px-2 py-1 border border-gray-300 rounded-md text-xs"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={loading || !pagination.hasPrevPage}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={loading || !pagination.hasNextPage}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
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
    </DashboardPage>
  );
};

export default EmployerCurrentJobs;
export { EmployerCurrentJobs };

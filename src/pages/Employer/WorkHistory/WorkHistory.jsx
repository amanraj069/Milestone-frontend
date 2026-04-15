import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DashboardPage from '../../../components/DashboardPage';
import FeedbackForm from '../../../components/FeedbackForm';
import SmartSearchInput from '../../../components/SmartSearchInput';
import FreelancerCard from './FreelancerCard';
import { graphqlRequest } from '../../../utils/graphqlClient';
import { checkCanGiveFeedback } from '../../../redux/slices/feedbackSlice';

const EMPLOYER_WORK_HISTORY_QUERY = `
  query EmployerWorkHistory(
    $search: String
    $searchFeature: String
    $sortBy: String
    $page: Int
    $limit: Int
    $statusIn: [String]
  ) {
    employerWorkHistory(
      search: $search
      searchFeature: $searchFeature
      sortBy: $sortBy
      page: $page
      limit: $limit
      statusIn: $statusIn
    ) {
      freelancers {
        userId
        freelancerId
        name
        email
        phone
        location
        picture
        rating
        jobId
        jobTitle
        jobDescription
        startDate
        endDate
        completedDate
        status
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
        statuses
      }
    }
  }
`;

const EmployerWorkHistory = () => {
  const [freelancers, setFreelancers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    avgRating: 0,
    avgDays: 0,
    successRate: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [searchFeature, setSearchFeature] = useState('name');
  const [sortBy, setSortBy] = useState('date-desc');
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [feedbackModal, setFeedbackModal] = useState(null); // { jobId, toUserId, toRole, counterpartyName }
  const inFlightRef = useRef('');
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get feedback eligibility data from Redux store
  const feedbackEligibilityMap = useSelector((state) => state.feedback.eligibilityByJob || {});

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const querySignature = JSON.stringify({
    debouncedSearchTerm,
    searchFeature,
    sortBy,
    currentPage,
    pageSize,
  });

  useEffect(() => {
    fetchWorkHistory();
  }, [querySignature]);

  // Check feedback eligibility for all completed jobs
  useEffect(() => {
    if (freelancers && freelancers.length > 0) {
      freelancers.forEach(freelancer => {
        if (freelancer.jobId) {
          dispatch(checkCanGiveFeedback(freelancer.jobId));
        }
      });
    }
  }, [freelancers, dispatch]);

  const fetchWorkHistory = async () => {
    const variables = {
      search: debouncedSearchTerm || null,
      searchFeature,
      sortBy,
      page: currentPage,
      limit: pageSize,
    };

    // Deduplicate in-flight requests 
    const requestKey = JSON.stringify(variables);
    if (inFlightRef.current === requestKey) return;

    try {
      setLoading(true);
      inFlightRef.current = requestKey;

      const data = await graphqlRequest({
        query: EMPLOYER_WORK_HISTORY_QUERY,
        variables,
      });

      const payload = data?.employerWorkHistory;
      if (payload) {
        setFreelancers(payload.freelancers || []);
        setStats(payload.stats || { total: 0, avgRating: 0, avgDays: 0, successRate: 0 });
        setPagination(payload.pagination || {
          page: currentPage,
          limit: pageSize,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        });
      }
    } catch (error) {
      console.error('Error fetching work history:', error);
    } finally {
      inFlightRef.current = '';
      setLoading(false);
      setHasLoadedOnce(true);
    }
  };

  const handleViewProfile = (freelancerId) => {
    navigate(`/freelancer/${freelancerId}`);
  };

  const handleLeaveFeedback = (freelancer) => {
    const eligibility = feedbackEligibilityMap[freelancer.jobId];
    
    if (eligibility?.canGiveFeedback) {
      setFeedbackModal({
        jobId: freelancer.jobId,
        toUserId: eligibility.counterparty.userId,
        toRole: eligibility.counterparty.role,
        counterpartyName: eligibility.counterparty.name
      });
    }
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
          <p className="text-gray-600">View freelancers who have previously worked on your projects</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-briefcase text-blue-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Completed Projects</p>
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

        {/* Search Bar + Sort + Status Filter */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SmartSearchInput
                value={searchTerm}
                onChange={(value) => {
                  setCurrentPage(1);
                  setSearchTerm(value);
                }}
                selectedFeature={searchFeature}
                onFeatureChange={(value) => {
                  setCurrentPage(1);
                  setSearchFeature(value);
                }}
                dataSource={freelancers}
                searchFields={[
                  { key: 'name', label: 'Name', getValue: (item) => item.name || '' },
                  { key: 'jobRole', label: 'Job Role', getValue: (item) => item.jobTitle || '' },
                  { key: 'location', label: 'Location', getValue: (item) => item.location || '' },
                ]}
                placeholder="Search work history..."
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => {
                setCurrentPage(1);
                setSortBy(e.target.value);
              }}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700 shrink-0"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="rating-desc">Highest Rated</option>
              <option value="rating-asc">Lowest Rated</option>
            </select>
          </div>
        </div>

        {/* Freelancers List */}
        {!hasLoadedOnce ? (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading work history...</p>
            </div>
          </div>
        ) : (
        <div className="bg-white rounded-xl shadow-md p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading work history...</p>
            </div>
          ) : freelancers.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-history text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-600">
                {searchTerm ? 'No freelancers found matching your search' : 'No work history available'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {freelancers.map((freelancer) => (
                <FreelancerCard
                  key={`${freelancer.freelancerId}-${freelancer.jobId}`}
                  freelancer={freelancer}
                  onLeaveFeedback={handleLeaveFeedback}
                />
              ))}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                  Showing {freelancers.length} of {pagination.total} records
                </p>
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
            </div>
          )}
        </div>
        )}
      </div>

      {/* Feedback Drawer */}
      <FeedbackForm
        isOpen={!!feedbackModal}
        jobId={feedbackModal?.jobId}
        toUserId={feedbackModal?.toUserId}
        toRole={feedbackModal?.toRole}
        counterpartyName={feedbackModal?.counterpartyName}
        onSuccess={() => {
          setFeedbackModal(null);
          dispatch(checkCanGiveFeedback(feedbackModal?.jobId));
        }}
        onCancel={() => setFeedbackModal(null)}
      />
    </DashboardPage>
  );
};

export default EmployerWorkHistory;

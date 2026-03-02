import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DashboardPage from '../../../components/DashboardPage';
import FeedbackForm from '../../../components/FeedbackForm';
import SmartSearchInput from '../../../components/SmartSearchInput';
import FreelancerCard from './FreelancerCard';
import axios from 'axios';
import { checkCanGiveFeedback } from '../../../redux/slices/feedbackSlice';

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
  const [searchFeature, setSearchFeature] = useState('name');
  const [sortBy, setSortBy] = useState('recent-left');
  const [statusFilter, setStatusFilter] = useState('all');
  const [feedbackModal, setFeedbackModal] = useState(null); // { jobId, toUserId, toRole, counterpartyName }
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get feedback eligibility data from Redux store
  const feedbackEligibilityMap = useSelector((state) => state.feedback.eligibilityByJob || {});

  useEffect(() => {
    fetchWorkHistory();
  }, []);

  useEffect(() => {
    // Start from base list
    let result = Array.isArray(freelancers) ? [...freelancers] : [];

    // Apply search if present
    const searchLower = searchTerm.trim().toLowerCase();
    if (searchLower) {
      result = result.filter((f) => {
        const name = String(f.name || '').toLowerCase();
        const jobRole = String(f.jobTitle || '').toLowerCase();
        const location = String(f.location || '').toLowerCase();

        if (searchFeature === 'name') return name.includes(searchLower);
        if (searchFeature === 'jobRole') return jobRole.includes(searchLower);
        if (searchFeature === 'location') return location.includes(searchLower);

        return name.includes(searchLower) || jobRole.includes(searchLower) || location.includes(searchLower);
      });
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter((f) => String(f.status || '').toLowerCase() === String(statusFilter).toLowerCase());
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent-left':
        // jobs that left/finished most recently
        result = result.sort((a, b) => new Date(b.completedDate || b.endDate || 0) - new Date(a.completedDate || a.endDate || 0));
        break;
      case 'oldest-left':
        result = result.sort((a, b) => new Date(a.completedDate || a.endDate || 0) - new Date(b.completedDate || b.endDate || 0));
        break;
      case 'rating-high-low':
        result = result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'rating-low-high':
        result = result.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case 'name-a-z':
        result = result.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        break;
      case 'name-z-a':
        result = result.sort((a, b) => String(b.name || '').localeCompare(String(a.name || '')));
        break;
      default:
        break;
    }

    setFilteredFreelancers(result);
  }, [searchTerm, freelancers, searchFeature, sortBy, statusFilter]);

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
            <div className="flex-1 min-w-0">
              <SmartSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                selectedFeature={searchFeature}
                onFeatureChange={setSearchFeature}
                dataSource={freelancers}
                searchFields={[
                  { key: 'name', label: 'Name', getValue: (item) => item.name || '' },
                  { key: 'jobRole', label: 'Job Role', getValue: (item) => item.jobTitle || '' },
                  { key: 'location', label: 'Location', getValue: (item) => item.location || '' },
                ]}
                placeholder="Search work history..."
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500">Sort by</div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent-left">Recent Left</option>
                <option value="oldest-left">Oldest Left</option>
                <option value="rating-high-low">Rating High - Low</option>
                <option value="rating-low-high">Rating Low - High</option>
                <option value="name-a-z">Name A - Z</option>
                <option value="name-z-a">Name Z - A</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-500">Filter</div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="left">Left Job</option>
                <option value="completed">Completed</option>
              </select>
            </div>
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
                <FreelancerCard
                  key={`${freelancer.freelancerId}-${freelancer.jobId}`}
                  freelancer={freelancer}
                  onLeaveFeedback={handleLeaveFeedback}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <FeedbackForm
              jobId={feedbackModal.jobId}
              toUserId={feedbackModal.toUserId}
              toRole={feedbackModal.toRole}
              counterpartyName={feedbackModal.counterpartyName}
              onSuccess={() => {
                setFeedbackModal(null);
                // Refresh eligibility
                dispatch(checkCanGiveFeedback(feedbackModal.jobId));
              }}
              onCancel={() => setFeedbackModal(null)}
            />
          </div>
        </div>
      )}
    </DashboardPage>
  );
};

export default EmployerWorkHistory;

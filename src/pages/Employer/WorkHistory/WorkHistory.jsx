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
  const [sortBy, setSortBy] = useState('date-desc');
  const [feedbackModal, setFeedbackModal] = useState(null); // { jobId, toUserId, toRole, counterpartyName }
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get feedback eligibility data from Redux store
  const feedbackEligibilityMap = useSelector((state) => state.feedback.eligibilityByJob || {});

  useEffect(() => {
    fetchWorkHistory();
  }, []);

  useEffect(() => {
    let list;
    if (searchTerm.trim() === '') {
      list = [...freelancers];
    } else {
      const searchLower = searchTerm.toLowerCase();
      list = freelancers.filter((f) => {
        if (searchFeature === 'name') {
          return f.name?.toLowerCase().includes(searchLower);
        }
        if (searchFeature === 'jobRole') {
          return f.jobTitle?.toLowerCase().includes(searchLower);
        }
        if (searchFeature === 'location') {
          return f.location?.toLowerCase().includes(searchLower);
        }
        return (
          f.name?.toLowerCase().includes(searchLower) ||
          f.jobTitle?.toLowerCase().includes(searchLower) ||
          f.location?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply sort
    list = [...list];
    switch (sortBy) {
      case 'date-desc':
        list.sort((a, b) => new Date(b.completedDate || b.leftDate || 0) - new Date(a.completedDate || a.leftDate || 0));
        break;
      case 'date-asc':
        list.sort((a, b) => new Date(a.completedDate || a.leftDate || 0) - new Date(b.completedDate || b.leftDate || 0));
        break;
      case 'name-asc':
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'rating-desc':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'rating-asc':
        list.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      default:
        break;
    }

    setFilteredFreelancers(list);
  }, [searchTerm, freelancers, searchFeature, sortBy]);

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
            <div className="flex-1">
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
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
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

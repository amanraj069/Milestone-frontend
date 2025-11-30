import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DashboardPage from '../../../components/DashboardPage';
import FeedbackForm from '../../../components/FeedbackForm';
import FreelancerCard from './FreelancerCard';
import axios from 'axios';
import { checkCanGiveFeedback, selectFeedbackEligibility } from '../../../store/slices/feedbackSlice';

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
  const [feedbackModal, setFeedbackModal] = useState(null); // { jobId, toUserId, toRole, counterpartyName }
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get feedback eligibility data from Redux store
  const feedbackEligibilityMap = useSelector((state) => state.feedback.eligibilityByJob || {});

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
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Work History</h1>
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

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardPage from '../../components/DashboardPage';
import { useChatContext } from '../../context/ChatContext';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

// Levenshtein distance algorithm for fuzzy search
const levenshteinDistance = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[len2][len1];
};

// Modal animation styles
const modalStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }

  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
`;

const ModeratorFreelancers = () => {
  const { openChatWith } = useChatContext();
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('name'); // 'name', 'email', or 'location'
  const [deleting, setDeleting] = useState(null);

  // Filter states
  const [ratingSort, setRatingSort] = useState('none'); // 'none', 'high-to-low', 'low-to-high'
  const [subscriptionFilter, setSubscriptionFilter] = useState('all'); // 'all', 'premium', 'basic'
  const [workingFilter, setWorkingFilter] = useState('all'); // 'all', 'working', 'not-working'

  // Autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Modal states
  const [applicationsModal, setApplicationsModal] = useState({ show: false, freelancerId: null, freelancerName: '', applications: []  });
  const [deleteModal, setDeleteModal] = useState({ show: false, freelancerId: null, name: '' });
  const [loadingApplications, setLoadingApplications] = useState(false);

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const fetchFreelancers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/moderator/freelancers`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setFreelancers(response.data.freelancers || []);
      }
    } catch (error) {
      console.error('Error fetching freelancers:', error);
      setError('Failed to load freelancers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (freelancerId, freelancerName) => {
    try {
      setLoadingApplications(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/moderator/freelancers/${freelancerId}/applications`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setApplicationsModal({
          show: true,
          freelancerId,
          freelancerName,
          applications: response.data.applications || []
        });
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Failed to load applications. Please try again.');
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleDeleteFreelancer = async () => {
    const { freelancerId } = deleteModal;
    setDeleting(freelancerId);

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/moderator/freelancers/${freelancerId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setFreelancers(freelancers.filter(f => f.freelancerId !== freelancerId));
        setDeleteModal({ show: false, freelancerId: null, name: '' });
      }
    } catch (error) {
      console.error('Error deleting freelancer:', error);
      alert('Failed to delete freelancer. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleChat = (freelancer) => {
    if (!freelancer.userId) {
      alert('Error: Unable to start chat. User ID not found.');
      return;
    }
    openChatWith(freelancer.userId);
  };

  // Generate autocomplete suggestions
  const generateSuggestions = (value) => {
    if (!value || value.trim() === '') {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchLower = value.toLowerCase();
    const uniqueValues = new Set();

    // Get unique values based on search mode
    freelancers.forEach(freelancer => {
      const fieldValue = searchMode === 'name' ? freelancer.name : 
                        searchMode === 'email' ? freelancer.email : 
                        freelancer.location;
      uniqueValues.add(fieldValue);
    });

    // Filter and rank suggestions using fuzzy matching
    const rankedSuggestions = Array.from(uniqueValues)
      .map(item => {
        const itemLower = item.toLowerCase();
        const startsWithMatch = itemLower.startsWith(searchLower);
        const includesMatch = itemLower.includes(searchLower);
        const distance = levenshteinDistance(searchLower, itemLower);

        let score = distance;
        if (startsWithMatch) score -= 1000;
        if (includesMatch) score -= 100;

        return { item, score, distance };
      })
      .filter(({ distance, item }) => {
        const threshold = Math.max(2, Math.floor(searchLower.length * 0.4));
        return item.toLowerCase().includes(searchLower) || distance <= threshold;
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map(({ item }) => item);

    setSuggestions(rankedSuggestions);
    setShowSuggestions(rankedSuggestions.length > 0);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    generateSuggestions(value);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setRatingSort('none');
    setSubscriptionFilter('all');
    setWorkingFilter('all');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const hasActiveFilters = searchTerm !== '' || ratingSort !== 'none' || subscriptionFilter !== 'all' || workingFilter !== 'all';

  // Filter and sort freelancers
  let filteredFreelancers = freelancers.filter(freelancer => {
    // Subscription filter
    if (subscriptionFilter === 'premium' && !freelancer.isPremium) return false;
    if (subscriptionFilter === 'basic' && freelancer.isPremium) return false;

    // Working status filter
    if (workingFilter === 'working' && !freelancer.isCurrentlyWorking) return false;
    if (workingFilter === 'not-working' && freelancer.isCurrentlyWorking) return false;

    // Search filter
    if (searchTerm.trim() === '') return true;

    const searchLower = searchTerm.toLowerCase();
    const searchField = searchMode === 'name' ? freelancer.name :
                       searchMode === 'email' ? freelancer.email :
                       freelancer.location;
    const fieldLower = searchField.toLowerCase();

    if (fieldLower.includes(searchLower)) return true;

    const threshold = Math.max(2, Math.floor(searchLower.length * 0.3));
    const distance = levenshteinDistance(searchLower, fieldLower);
    return distance <= threshold;
  });

  // Apply rating sorting
  if (ratingSort === 'high-to-low') {
    filteredFreelancers = [...filteredFreelancers].sort((a, b) => b.rating - a.rating);
  } else if (ratingSort === 'low-to-high') {
    filteredFreelancers = [...filteredFreelancers].sort((a, b) => a.rating - b.rating);
  }

  // Calculate statistics
  const totalFreelancers = freelancers.length;
  const currentlyWorking = freelancers.filter(f => f.isCurrentlyWorking).length;
  const premiumUsers = freelancers.filter(f => f.isPremium).length;

  const content = (
    <div className="space-y-6">
      {/* Inject modal animation styles */}
      <style>{modalStyles}</style>

      <p className="text-gray-500 -mt-6">View and manage all registered freelancers</p>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Freelancers</p>
          <p className="text-2xl font-semibold text-gray-900">{totalFreelancers}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Currently Working</p>
          <p className="text-2xl font-semibold text-gray-900">{currentlyWorking}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Premium Users</p>
          <p className="text-2xl font-semibold text-gray-900">{premiumUsers}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sort by Rating</label>
            <select
              value={ratingSort}
              onChange={(e) => setRatingSort(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="none">Default</option>
              <option value="high-to-low">High to Low</option>
              <option value="low-to-high">Low to High</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Subscription Type</label>
            <select
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="premium">Premium</option>
              <option value="basic">Basic</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Working Status</label>
            <select
              value={workingFilter}
              onChange={(e) => setWorkingFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="working">Currently Working</option>
              <option value="not-working">Not Working</option>
            </select>
          </div>

          {hasActiveFilters && (
            <div>
              <label className="block text-xs font-medium text-transparent mb-1">.</label>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            </div>
          )}

          <div className="ml-auto text-sm text-gray-500 whitespace-nowrap">
            Showing: {filteredFreelancers.length} of {totalFreelancers}
          </div>
        </div>

        {/* Search Row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-medium text-gray-500">Search by:</label>
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => {
                  setSearchMode('name');
                  setSearchTerm('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  searchMode === 'name'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Name
              </button>
              <button
                onClick={() => {
                  setSearchMode('email');
                  setSearchTerm('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  searchMode === 'email'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => {
                  setSearchMode('location');
                  setSearchTerm('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  searchMode === 'location'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Location
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={`Search by ${searchMode}... `}
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggestions(false), 200);
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span className="flex-1">{suggestion}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading freelancers...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-red-600 mb-2">Error loading freelancers</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={fetchFreelancers} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">Retry</button>
        </div>
      )}

      {!loading && !error && filteredFreelancers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-700 mb-1">No freelancers found</p>
          <p className="text-gray-500">{searchTerm || hasActiveFilters ? 'No freelancers match your filters.' : 'There are no registered freelancers.'}</p>
        </div>
      )}

      {!loading && !error && filteredFreelancers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscribed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFreelancers.map((freelancer) => (
                  <tr 
                    key={freelancer.freelancerId} 
                    className={`hover:bg-gray-50 ${freelancer.isCurrentlyWorking ? 'bg-green-400/20' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <img
                        src={freelancer.picture}
                        alt={freelancer.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => { e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'; }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{freelancer.name}</td>
                    <td className="px-4 py-3 text-gray-600">{freelancer.email}</td>
                    <td className="px-4 py-3 text-gray-600">{freelancer.phone || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-medium text-gray-900">{freelancer.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        freelancer.isPremium ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {freelancer.isPremium ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {freelancer.isPremium && freelancer.subscriptionExpiryDate ? (
                        <div>
                          <div>Expires: {new Date(freelancer.subscriptionExpiryDate).toLocaleDateString()}</div>
                          {freelancer.subscriptionDuration && (
                            <div className="text-gray-500">({freelancer.subscriptionDuration} months)</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => fetchApplications(freelancer.freelancerId, freelancer.name)}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        disabled={loadingApplications}
                      >
                        {freelancer.applicationsCount || 0}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(freelancer.joinedDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button 
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700"
                          onClick={() => handleChat(freelancer)}
                        >
                          Chat
                        </button>
                        <button 
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700" 
                          onClick={() => setDeleteModal({ show: true, freelancerId: freelancer.freelancerId, name: freelancer.name })}
                          disabled={deleting === freelancer.freelancerId}
                        >
                          {deleting === freelancer.freelancerId ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Applications Modal */}
      {applicationsModal.show && (
        <div 
          className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setApplicationsModal({ show: false, freelancerId: null, freelancerName: '', applications: [] })}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Job Applications</h3>
                <p className="text-sm text-gray-500 mt-1">{applicationsModal.freelancerName}</p>
              </div>
              <button
                onClick={() => setApplicationsModal({ show: false, freelancerId: null, freelancerName: '', applications: [] })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-140px)]">
              {loadingApplications ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                  <p className="text-gray-500 mt-2">Loading applications...</p>
                </div>
              ) : applicationsModal.applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No applications yet for this freelancer.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applicationsModal.applications.map((application) => (
                    <div key={application.applicationId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{application.jobTitle}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Applied on: {new Date(application.appliedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          application.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                          application.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {application.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setApplicationsModal({ show: false, freelancerId: null, freelancerName: '', applications: [] })}
                className="px-4 py-2 bg-gray-600 text-white rounded-md text-sm font-medium hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div 
          className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setDeleteModal({ show: false, freelancerId: null, name: '' })}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
            </div>

            <div className="px-6 py-4">
              <p className="text-gray-700">
                Are you sure you want to delete freelancer <span className="font-semibold">"{deleteModal.name}"</span>?
              </p>
              <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, freelancerId: null, name: '' })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFreelancer}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Freelancer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return <DashboardPage title="Freelancers">{content}</DashboardPage>;
};

export default ModeratorFreelancers;

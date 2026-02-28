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
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
  .animate-slideUp { animation: slideUp 0.3s ease-out; }
`;

const ModeratorEmployers = () => {
  const { openChatWith } = useChatContext();
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState('name'); // 'name', 'email', 'company'
  const [deleting, setDeleting] = useState(null);

  // Filter states
  const [ratingSort, setRatingSort] = useState('none');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [hiresSort, setHiresSort] = useState('none');

  // Autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Modal states
  const [jobListingsModal, setJobListingsModal] = useState({ show: false, employerId: null, employerName: '', jobListings: [] });
  const [deleteModal, setDeleteModal] = useState({ show: false, employerId: null, name: '' });
  const [loadingJobListings, setLoadingJobListings] = useState(false);

  useEffect(() => {
    fetchEmployers();
  }, []);

  const fetchEmployers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/moderator/employers`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setEmployers(response.data.employers || []);
      }
    } catch (error) {
      console.error('Error fetching employers:', error);
      setError('Failed to load employers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobListings = async (employerId, employerName) => {
    try {
      setLoadingJobListings(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/moderator/employers/${employerId}/job-listings`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setJobListingsModal({
          show: true,
          employerId,
          employerName,
          jobListings: response.data.jobListings || []
        });
      }
    } catch (error) {
      console.error('Error fetching job listings:', error);
      alert('Failed to load job listings. Please try again.');
    } finally {
      setLoadingJobListings(false);
    }
  };

  const handleDeleteEmployer = async () => {
    const { employerId } = deleteModal;
    setDeleting(employerId);

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/moderator/employers/${employerId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setEmployers(employers.filter(e => e.employerId !== employerId));
        setDeleteModal({ show: false, employerId: null, name: '' });
      }
    } catch (error) {
      console.error('Error deleting employer:', error);
      alert('Failed to delete employer. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleChat = (employer) => {
    if (!employer.userId) {
      alert('Error: Unable to start chat. User ID not found.');
      return;
    }
    openChatWith(employer.userId);
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

    employers.forEach(employer => {
      const fieldValue = searchMode === 'name' ? employer.name :
                        searchMode === 'email' ? employer.email :
                        employer.companyName;
      uniqueValues.add(fieldValue);
    });

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
    setHiresSort('none');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const hasActiveFilters = searchTerm !== '' || ratingSort !== 'none' || subscriptionFilter !== 'all' || hiresSort !== 'none';

  // Filter and sort employers
  let filteredEmployers = employers.filter(employer => {
    // Subscription filter
    if (subscriptionFilter === 'premium' && !employer.isPremium) return false;
    if (subscriptionFilter === 'basic' && employer.isPremium) return false;

    // Search filter
    if (searchTerm.trim() === '') return true;

    const searchLower = searchTerm.toLowerCase();
    const searchField = searchMode === 'name' ? employer.name :
                       searchMode === 'email' ? employer.email :
                       employer.companyName;
    const fieldLower = searchField.toLowerCase();

    if (fieldLower.includes(searchLower)) return true;

    const threshold = Math.max(2, Math.floor(searchLower.length * 0.3));
    const distance = levenshteinDistance(searchLower, fieldLower);
    return distance <= threshold;
  });

  // Apply rating sorting
  if (ratingSort === 'high-to-low') {
    filteredEmployers = [...filteredEmployers].sort((a, b) => b.rating - a.rating);
  } else if (ratingSort === 'low-to-high') {
    filteredEmployers = [...filteredEmployers].sort((a, b) => a.rating - b.rating);
  }

  // Apply hires sorting
  if (hiresSort === 'high-to-low') {
    filteredEmployers = [...filteredEmployers].sort((a, b) => b.hiredCount - a.hiredCount);
  } else if (hiresSort === 'low-to-high') {
    filteredEmployers = [...filteredEmployers].sort((a, b) => a.hiredCount - b.hiredCount);
  }

  // Calculate statistics
  const totalEmployers = employers.length;
  const premiumEmployers = employers.filter(e => e.isPremium).length;
  const totalJobListings = employers.reduce((sum, e) => sum + (e.jobListingsCount || 0), 0);

  const content = (
    <div className="space-y-6">
      <style>{modalStyles}</style>

      <p className="text-gray-500 -mt-6">View and manage all registered employers</p>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Employers</p>
          <p className="text-2xl font-semibold text-gray-900">{totalEmployers}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Premium Employers</p>
          <p className="text-2xl font-semibold text-gray-900">{premiumEmployers}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Job Listings</p>
          <p className="text-2xl font-semibold text-gray-900">{totalJobListings}</p>
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
            <label className="block text-xs font-medium text-gray-500 mb-1">Sort by Hires</label>
            <select
              value={hiresSort}
              onChange={(e) => setHiresSort(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="none">Default</option>
              <option value="high-to-low">High to Low</option>
              <option value="low-to-high">Low to High</option>
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
            Showing: {filteredEmployers.length} of {totalEmployers}
          </div>
        </div>

        {/* Search Row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <label className="text-xs font-medium text-gray-500">Search by:</label>
            <div className="flex bg-gray-100 rounded-md p-1">
              <button
                onClick={() => { setSearchMode('name'); setSearchTerm(''); setSuggestions([]); setShowSuggestions(false); }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  searchMode === 'name' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Name
              </button>
              <button
                onClick={() => { setSearchMode('email'); setSearchTerm(''); setSuggestions([]); setShowSuggestions(false); }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  searchMode === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => { setSearchMode('company'); setSearchTerm(''); setSuggestions([]); setShowSuggestions(false); }}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  searchMode === 'company' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Company
              </button>
            </div>
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={`Search by ${searchMode}... `}
              value={searchTerm}
              onChange={handleSearchChange}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

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
          <p className="text-gray-500">Loading employers...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-red-600 mb-2">Error loading employers</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={fetchEmployers} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">Retry</button>
        </div>
      )}

      {!loading && !error && filteredEmployers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-700 mb-1">No employers found</p>
          <p className="text-gray-500">{searchTerm || hasActiveFilters ? 'No employers match your filters.' : 'There are no registered employers.'}</p>
        </div>
      )}

      {!loading && !error && filteredEmployers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscribed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sub. Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Listings</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hired</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployers.map((employer) => (
                  <tr key={employer.employerId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <img
                        src={employer.picture}
                        alt={employer.name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => { e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'; }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{employer.name}</td>
                    <td className="px-4 py-3 text-gray-600">{employer.companyName || 'N/A'}</td>
                    <td className="px-4 py-3 text-gray-600">{employer.email}</td>
                    <td className="px-4 py-3 text-gray-600">{employer.phone || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span className="font-medium text-gray-900">{employer.rating.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        employer.isPremium ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {employer.isPremium ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {employer.isPremium && employer.subscriptionExpiryDate ? (
                        <div>
                          <div>Expires: {new Date(employer.subscriptionExpiryDate).toLocaleDateString()}</div>
                          {employer.subscriptionDuration && (
                            <div className="text-gray-500">({employer.subscriptionDuration} months)</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => fetchJobListings(employer.employerId, employer.name)}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        disabled={loadingJobListings}
                      >
                        {employer.jobListingsCount || 0}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{employer.hiredCount || 0}</span>
                      {employer.currentHires > 0 && (
                        <span className="text-xs text-green-600 ml-1">({employer.currentHires} active)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(employer.joinedDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700"
                          onClick={() => handleChat(employer)}
                        >
                          Chat
                        </button>
                        <button
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700"
                          onClick={() => setDeleteModal({ show: true, employerId: employer.employerId, name: employer.name })}
                          disabled={deleting === employer.employerId}
                        >
                          {deleting === employer.employerId ? 'Deleting...' : 'Delete'}
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

      {/* Job Listings Modal */}
      {jobListingsModal.show && (
        <div
          className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setJobListingsModal({ show: false, employerId: null, employerName: '', jobListings: [] })}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Job Listings</h3>
                <p className="text-sm text-gray-500 mt-1">{jobListingsModal.employerName}</p>
              </div>
              <button
                onClick={() => setJobListingsModal({ show: false, employerId: null, employerName: '', jobListings: [] })}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-140px)]">
              {loadingJobListings ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
                  <p className="text-gray-500 mt-2">Loading job listings...</p>
                </div>
              ) : jobListingsModal.jobListings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No job listings posted by this employer.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobListingsModal.jobListings.map((job) => (
                    <div key={job.jobId} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{job.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span>Budget: ${job.budget?.toLocaleString()}</span>
                            <span>Type: {job.jobType}</span>
                            <span>Posted: {new Date(job.postedDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          job.status === 'open' ? 'bg-green-100 text-green-700' :
                          job.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                          job.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                          job.status === 'closed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setJobListingsModal({ show: false, employerId: null, employerName: '', jobListings: [] })}
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
          onClick={() => setDeleteModal({ show: false, employerId: null, name: '' })}
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
                Are you sure you want to delete employer <span className="font-semibold">"{deleteModal.name}"</span>?
              </p>
              <p className="text-sm text-red-600 mt-2">This action cannot be undone.</p>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, employerId: null, name: '' })}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEmployer}
                className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Employer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return <DashboardPage title="Employers">{content}</DashboardPage>;
};

export default ModeratorEmployers;


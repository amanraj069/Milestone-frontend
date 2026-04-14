import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardPage from '../../components/DashboardPage';
import SmartFilter from '../../components/SmartFilter';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';
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
  const [totalFreelancersCount, setTotalFreelancersCount] = useState(0);
  const [serverPagination, setServerPagination] = useState(null);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(null);

  // Sort state (replaces multiple dropdown filters)
  const [sortBy, setSortBy] = useState('recent'); // 'recent','oldest','name-az','name-za','rating-high-low','rating-low-high'

  // Column-level SmartFilter states
  const [nameFilters, setNameFilters] = useState([]);
  const [emailFilters, setEmailFilters] = useState([]);
  const [phoneFilters, setPhoneFilters] = useState([]);
  const [ratingFilters, setRatingFilters] = useState([]);
  const [subscribedFilters, setSubscribedFilters] = useState([]);
  const [durationFilters, setDurationFilters] = useState([]);

  // Modal states
  const [applicationsModal, setApplicationsModal] = useState({ show: false, freelancerId: null, freelancerName: '', applications: []  });
  const [deleteModal, setDeleteModal] = useState({ show: false, freelancerId: null, name: '' });
  const [loadingApplications, setLoadingApplications] = useState(false);

  // Column visibility state - all visible except 'joined' by default
  const allColumns = [
    { key: 'photo', label: 'Photo' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'rating', label: 'Rating' },
    { key: 'subscribed', label: 'Subscribed' },
    { key: 'subscriptionDuration', label: 'Subscription Duration' },
    { key: 'applications', label: 'Applications' },
    { key: 'joined', label: 'Joined', defaultVisible: false },
    { key: 'actions', label: 'Actions' },
  ];
  const { visible: visibleColumns, setVisible: setVisibleColumns } = useSmartColumnToggle(
    allColumns,
    'moderator-freelancers-visible-columns'
  );

  const isColumnVisible = (columnKey) => visibleColumns.has(columnKey);

  const filterSignature = JSON.stringify({
    searchTerm,
    sortBy,
    nameFilters,
    emailFilters,
    phoneFilters,
    ratingFilters,
    subscribedFilters,
    durationFilters,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFreelancers(currentPage, pageSize);
    }, 250);

    return () => clearTimeout(timer);
  }, [currentPage, pageSize, filterSignature]);

  const fetchFreelancers = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/moderator/freelancers`,
        {
          withCredentials: true,
          params: {
            page,
            limit,
            search: searchTerm.trim() || undefined,
            sortBy,
            nameIn: nameFilters.length ? nameFilters : undefined,
            emailIn: emailFilters.length ? emailFilters : undefined,
            phoneIn: phoneFilters.length ? phoneFilters : undefined,
            ratingIn: ratingFilters.length ? ratingFilters : undefined,
            subscribedIn: subscribedFilters.length ? subscribedFilters : undefined,
            durationIn: durationFilters.length ? durationFilters : undefined,
          },
        }
      );

      if (response.data.success) {
        setFreelancers(response.data.freelancers || []);
        setTotalFreelancersCount(response.data.total || 0);
        setServerPagination(response.data.pagination || null);
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

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setSortBy('recent');
    setNameFilters([]);
    setEmailFilters([]);
    setPhoneFilters([]);
    setRatingFilters([]);
    setSubscribedFilters([]);
    setDurationFilters([]);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '' ||
    nameFilters.length > 0 || emailFilters.length > 0 || phoneFilters.length > 0 || 
    ratingFilters.length > 0 || subscribedFilters.length > 0 || durationFilters.length > 0;

  const displayedFreelancers = freelancers;

  // Calculate statistics
  const totalFreelancers = totalFreelancersCount || freelancers.length;
  const currentlyWorking = freelancers.filter(f => f.isCurrentlyWorking).length;
  const premiumUsers = freelancers.filter(f => f.isPremium).length;
  const avgRating = totalFreelancers > 0 ? (freelancers.reduce((s, f) => s + (f.rating || 0), 0) / totalFreelancers).toFixed(1) : '0.0';
  const avgDays = totalFreelancers > 0 ? Math.round(freelancers.reduce((s, f) => {
    const jd = f.joinedDate ? new Date(f.joinedDate) : null;
    if (!jd || Number.isNaN(jd.getTime())) return s + 0;
    const diffMs = (new Date()).setHours(0,0,0,0) - jd.setHours(0,0,0,0);
    return s + Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }, 0) / totalFreelancers) : 0;
  const successRate = totalFreelancers > 0 ? Math.round((currentlyWorking / totalFreelancers) * 100) : 0;

  const content = (
    <div className="space-y-6">
      {/* Inject modal animation styles */}
      <style>{modalStyles}</style>

      <p className="text-gray-500 mt-1">View and manage all registered freelancers</p>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-users text-blue-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Freelancers</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{totalFreelancers}</p>
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
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{avgRating}</p>
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
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{avgDays}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-check-circle text-emerald-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Success Rate</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{successRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        {/* Compact filters row (kept empty for spacing) */}
          <div className="flex items-center gap-4">
          </div>

        {/* Search Row with Sort and Column Toggle */}
        <div className="relative flex items-center gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search freelancers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500">Sort By</div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">Recent Joined</option>
              <option value="oldest">Oldest Joined</option>
              <option value="name-az">Name A - Z</option>
              <option value="name-za">Name Z - A</option>
              <option value="rating-high-low">Rating High - Low</option>
              <option value="rating-low-high">Rating Low - High</option>
            </select>

            <SmartColumnToggle
              columns={allColumns}
              visible={visibleColumns}
              onChange={setVisibleColumns}
              storageKey="moderator-freelancers-visible-columns"
            />

            <button
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className={`px-3 py-2 ml-2 rounded-md text-sm font-medium border ${hasActiveFilters ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'}`}
            >
              Clear Filters
            </button>
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
          <button onClick={() => fetchFreelancers(currentPage, pageSize)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">Retry</button>
        </div>
      )}

      {!loading && !error && displayedFreelancers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-700 mb-1">No freelancers found</p>
          <p className="text-gray-500">{searchTerm || hasActiveFilters ? 'No freelancers match your filters.' : 'There are no registered freelancers.'}</p>
        </div>
      )}

      {!loading && !error && displayedFreelancers.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {isColumnVisible('photo') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>}
                  {isColumnVisible('name') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-2">
                        Name
                        <SmartFilter
                          label="Filter"
                          data={freelancers}
                          field="name"
                          selectedValues={nameFilters}
                          onFilterChange={setNameFilters}
                        />
                      </div>
                    </th>
                  )}
                  {isColumnVisible('email') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-2">
                        Email
                        <SmartFilter
                          label="Filter"
                          data={freelancers}
                          field="email"
                          selectedValues={emailFilters}
                          onFilterChange={setEmailFilters}
                        />
                      </div>
                    </th>
                  )}
                  {isColumnVisible('phone') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-2">
                        Phone
                        <SmartFilter
                          label="Filter"
                          data={freelancers}
                          field="phone"
                          selectedValues={phoneFilters}
                          onFilterChange={setPhoneFilters}
                          valueExtractor={(f) => f.phone || 'N/A'}
                        />
                      </div>
                    </th>
                  )}
                  {isColumnVisible('rating') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-2">
                        Rating
                        <SmartFilter
                          label="Filter"
                          data={freelancers}
                          field="rating"
                          selectedValues={ratingFilters}
                          onFilterChange={setRatingFilters}
                          valueFormatter={(v) => `★ ${v.toFixed(1)}`}
                        />
                      </div>
                    </th>
                  )}
                  {isColumnVisible('subscribed') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-2">
                        Subscribed
                        <SmartFilter
                          label="Filter"
                          data={freelancers}
                          field="isPremium"
                          selectedValues={subscribedFilters}
                          onFilterChange={setSubscribedFilters}
                          valueExtractor={(f) => f.isPremium ? 'Yes' : 'No'}
                        />
                      </div>
                    </th>
                  )}
                  {isColumnVisible('subscriptionDuration') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-2">
                        Duration
                        <SmartFilter
                          label="Filter"
                          data={freelancers}
                          field="subscriptionDuration"
                          selectedValues={durationFilters}
                          onFilterChange={setDurationFilters}
                          valueExtractor={(f) => f.subscriptionDuration || 0}
                          valueFormatter={(v) => v === 0 ? 'None' : `${v} months`}
                        />
                      </div>
                    </th>
                  )}
                  {isColumnVisible('applications') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>}
                  {isColumnVisible('joined') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>}
                  {isColumnVisible('actions') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedFreelancers.map((freelancer) => (
                  <tr
                    key={freelancer.freelancerId}
                    className={`${freelancer.isCurrentlyWorking ? 'bg-green-400/20 hover:bg-green-400/20' : 'hover:bg-gray-50'}`}
                  >
                    {isColumnVisible('photo') && (
                      <td className="px-4 py-3">
                        <img
                          src={freelancer.picture}
                          alt={freelancer.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => { e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'; }}
                        />
                      </td>
                    )}
                    {isColumnVisible('name') && <td className="px-4 py-3 font-medium text-gray-900">{freelancer.name}</td>}
                    {isColumnVisible('email') && <td className="px-4 py-3 text-gray-600">{freelancer.email}</td>}
                    {isColumnVisible('phone') && <td className="px-4 py-3 text-gray-600">{freelancer.phone || 'N/A'}</td>}
                    {isColumnVisible('rating') && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium text-gray-900">{freelancer.rating.toFixed(1)}</span>
                        </div>
                      </td>
                    )}
                    {isColumnVisible('subscribed') && (
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          freelancer.isPremium ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {freelancer.isPremium ? 'Yes' : 'No'}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('subscriptionDuration') && (
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
                    )}
                    {isColumnVisible('applications') && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => fetchApplications(freelancer.freelancerId, freelancer.name)}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          disabled={loadingApplications}
                        >
                          {freelancer.applicationsCount || 0}
                        </button>
                      </td>
                    )}
                    {isColumnVisible('joined') && <td className="px-4 py-3 text-gray-600">{new Date(freelancer.joinedDate).toLocaleDateString()}</td>}
                    {isColumnVisible('actions') && (
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
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Showing count moved to table footer */}
          <div className="px-4 py-3 text-sm text-gray-600 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                Showing {displayedFreelancers.length} freelancers on page {currentPage} (total {totalFreelancers})
              </div>
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
                  disabled={loading || currentPage <= 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={loading || !serverPagination?.hasNextPage}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            </div>
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

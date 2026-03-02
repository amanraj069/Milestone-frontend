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
  const [deleting, setDeleting] = useState(null);

  // Filter states
  const [ratingSort, setRatingSort] = useState('none');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [hiresSort, setHiresSort] = useState('none');
  const [sortBy, setSortBy] = useState('recent'); // unified sort state (replaces top dropdowns in UI)

  // Column-level SmartFilter states
  const [nameFilters, setNameFilters] = useState([]);
  const [companyFilters, setCompanyFilters] = useState([]);
  const [emailFilters, setEmailFilters] = useState([]);
  const [phoneFilters, setPhoneFilters] = useState([]);
  const [ratingFilters, setRatingFilters] = useState([]);
  const [subscribedFilters, setSubscribedFilters] = useState([]);
  const [durationFilters, setDurationFilters] = useState([]);

  // Modal states
  const [jobListingsModal, setJobListingsModal] = useState({ show: false, employerId: null, employerName: '', jobListings: [] });
  const [deleteModal, setDeleteModal] = useState({ show: false, employerId: null, name: '' });
  const [loadingJobListings, setLoadingJobListings] = useState(false);

  // Column visibility
  const allColumns = [
    { key: 'photo', label: 'Photo' },
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', defaultVisible: false },
    { key: 'rating', label: 'Rating' },
    { key: 'subscribed', label: 'Subscribed' },
    { key: 'subDuration', label: 'Sub. Duration' },
    { key: 'jobListings', label: 'Job Listings' },
    { key: 'hired', label: 'Hired' },
    { key: 'joined', label: 'Joined', defaultVisible: false },
    { key: 'actions', label: 'Actions' },
  ];
  const { visible: visibleColumns, setVisible: setVisibleColumns } = useSmartColumnToggle(
    allColumns,
    'moderator-employers-visible-columns'
  );
  const isColumnVisible = (columnKey) => visibleColumns.has(columnKey);

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

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setRatingSort('none');
    setSubscriptionFilter('all');
    setHiresSort('none');
    setNameFilters([]);
    setCompanyFilters([]);
    setEmailFilters([]);
    setPhoneFilters([]);
    setRatingFilters([]);
    setSubscribedFilters([]);
    setDurationFilters([]);
  };

  const hasActiveFilters = searchTerm !== '' || ratingSort !== 'none' || subscriptionFilter !== 'all' || hiresSort !== 'none' ||
    nameFilters.length > 0 || companyFilters.length > 0 || emailFilters.length > 0 || phoneFilters.length > 0 ||
    ratingFilters.length > 0 || subscribedFilters.length > 0 || durationFilters.length > 0;

  // Filter and sort employers
  let filteredEmployers = employers.filter(employer => {
    // Subscription filter
    if (subscriptionFilter === 'premium' && !employer.isPremium) return false;
    if (subscriptionFilter === 'basic' && employer.isPremium) return false;

    // Column SmartFilter filters
    if (nameFilters.length > 0 && !nameFilters.includes(employer.name)) return false;
    if (companyFilters.length > 0 && !companyFilters.includes(employer.companyName || 'N/A')) return false;
    if (emailFilters.length > 0 && !emailFilters.includes(employer.email)) return false;
    if (phoneFilters.length > 0 && !phoneFilters.includes(employer.phone || 'N/A')) return false;
    if (ratingFilters.length > 0 && !ratingFilters.includes(employer.rating)) return false;
    if (subscribedFilters.length > 0 && !subscribedFilters.includes(employer.isPremium ? 'Yes' : 'No')) return false;
    if (durationFilters.length > 0 && !durationFilters.includes(employer.subscriptionDuration || 0)) return false;

    // Search filter - regex based across all fields
    if (searchTerm.trim() === '') return true;

    try {
      const regex = new RegExp(searchTerm, 'i');
      return (
        regex.test(employer.name || '') ||
        regex.test(employer.email || '') ||
        regex.test(employer.companyName || '') ||
        regex.test(employer.phone || '')
      );
    } catch (e) {
      // Invalid regex, fall back to includes
      const searchLower = searchTerm.toLowerCase();
      return (
        (employer.name || '').toLowerCase().includes(searchLower) ||
        (employer.email || '').toLowerCase().includes(searchLower) ||
        (employer.companyName || '').toLowerCase().includes(searchLower) ||
        (employer.phone || '').toLowerCase().includes(searchLower)
      );
    }
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

  // Apply unified sortBy (if used)
  if (sortBy === 'name-az') {
    filteredEmployers = [...filteredEmployers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sortBy === 'name-za') {
    filteredEmployers = [...filteredEmployers].sort((a, b) => (b.name || '').localeCompare(a.name || ''));
  } else if (sortBy === 'rating-high-low') {
    filteredEmployers = [...filteredEmployers].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  } else if (sortBy === 'rating-low-high') {
    filteredEmployers = [...filteredEmployers].sort((a, b) => (Number(a.rating) || 0) - (Number(b.rating) || 0));
  } else if (sortBy === 'jobListings-high-low') {
    filteredEmployers = [...filteredEmployers].sort((a, b) => (Number(b.jobListingsCount) || 0) - (Number(a.jobListingsCount) || 0));
  } else if (sortBy === 'jobListings-low-high') {
    filteredEmployers = [...filteredEmployers].sort((a, b) => (Number(a.jobListingsCount) || 0) - (Number(b.jobListingsCount) || 0));
  } else if (sortBy === 'recent') {
    filteredEmployers = [...filteredEmployers].sort((a, b) => new Date(b.joinedDate || 0) - new Date(a.joinedDate || 0));
  } else if (sortBy === 'oldest') {
    filteredEmployers = [...filteredEmployers].sort((a, b) => new Date(a.joinedDate || 0) - new Date(b.joinedDate || 0));
  }

  // Calculate statistics
  const totalEmployers = employers.length;
  const premiumEmployers = employers.filter(e => e.isPremium).length;
  const totalJobListings = employers.reduce((sum, e) => sum + (e.jobListingsCount || 0), 0);
  const avgRating = totalEmployers > 0 ? (employers.reduce((s, e) => s + (e.rating || 0), 0) / totalEmployers).toFixed(1) : '0.0';
  const avgDays = totalEmployers > 0 ? Math.round(employers.reduce((s, e) => {
    const jd = e.joinedDate ? new Date(e.joinedDate) : null;
    if (!jd || Number.isNaN(jd.getTime())) return s + 0;
    const diffMs = (new Date()).setHours(0,0,0,0) - jd.setHours(0,0,0,0);
    return s + Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }, 0) / totalEmployers) : 0;

  const content = (
    <div className="space-y-6">
      <style>{modalStyles}</style>

      <p className="text-gray-500 -mt-6">View and manage all registered employers</p>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-building text-blue-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Employers</p>
              <p className="text-2xl font-bold text-gray-800">{totalEmployers}</p>
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
              <p className="text-2xl font-bold text-gray-800">{avgRating}</p>
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
              <p className="text-2xl font-bold text-gray-800">{avgDays}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-list text-emerald-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Job Listings</p>
              <p className="text-2xl font-bold text-gray-800">{totalJobListings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        {/* Spacer row (top filters removed in favor of inline search controls) */}
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
              placeholder="Search employers..."
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
              <option value="jobListings-high-low">Job Listings High - Low</option>
              <option value="jobListings-low-high">Job Listings Low - High</option>
            </select>

            <SmartColumnToggle
              columns={allColumns}
              visible={visibleColumns}
              onChange={setVisibleColumns}
              label="Columns"
              heading="Toggle Columns"
              triggerClassName="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              dropdownClassName="absolute left-0 mt-1 min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg z-20"
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
                  {isColumnVisible('photo') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>}
                  {isColumnVisible('name') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-2">
                        Name
                        <SmartFilter
                          label="Filter"
                          data={employers}
                          field="name"
                          selectedValues={nameFilters}
                          onFilterChange={setNameFilters}
                        />
                      </div>
                    </th>
                  )}
                  {isColumnVisible('company') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-2">
                        Company
                        <SmartFilter
                          label="Filter"
                          data={employers}
                          field="companyName"
                          selectedValues={companyFilters}
                          onFilterChange={setCompanyFilters}
                          valueExtractor={(e) => e.companyName || 'N/A'}
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
                          data={employers}
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
                          data={employers}
                          field="phone"
                          selectedValues={phoneFilters}
                          onFilterChange={setPhoneFilters}
                          valueExtractor={(e) => e.phone || 'N/A'}
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
                          data={employers}
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
                          data={employers}
                          field="isPremium"
                          selectedValues={subscribedFilters}
                          onFilterChange={setSubscribedFilters}
                          valueExtractor={(e) => e.isPremium ? 'Yes' : 'No'}
                        />
                      </div>
                    </th>
                  )}
                  {isColumnVisible('subDuration') && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-2">
                        Duration
                        <SmartFilter
                          label="Filter"
                          data={employers}
                          field="subscriptionDuration"
                          selectedValues={durationFilters}
                          onFilterChange={setDurationFilters}
                          valueExtractor={(e) => e.subscriptionDuration || 0}
                          valueFormatter={(v) => v === 0 ? 'None' : `${v} months`}
                        />
                      </div>
                    </th>
                  )}
                  {isColumnVisible('jobListings') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Listings</th>}
                  {isColumnVisible('hired') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hired</th>}
                  {isColumnVisible('joined') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>}
                  {isColumnVisible('actions') && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployers.map((employer) => (
                  <tr key={employer.employerId} className="hover:bg-gray-50">
                    {isColumnVisible('photo') && (
                      <td className="px-4 py-3">
                        <img
                          src={employer.picture}
                          alt={employer.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => { e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'; }}
                        />
                      </td>
                    )}
                    {isColumnVisible('name') && (
                      <td className="px-4 py-3 font-medium text-gray-900">{employer.name}</td>
                    )}
                    {isColumnVisible('company') && (
                      <td className="px-4 py-3 text-gray-600">{employer.companyName || 'N/A'}</td>
                    )}
                    {isColumnVisible('email') && (
                      <td className="px-4 py-3 text-gray-600">{employer.email}</td>
                    )}
                    {isColumnVisible('phone') && (
                      <td className="px-4 py-3 text-gray-600">{employer.phone || 'N/A'}</td>
                    )}
                    {isColumnVisible('rating') && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium text-gray-900">{employer.rating.toFixed(1)}</span>
                        </div>
                      </td>
                    )}
                    {isColumnVisible('subscribed') && (
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          employer.isPremium ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {employer.isPremium ? 'Yes' : 'No'}
                        </span>
                      </td>
                    )}
                    {isColumnVisible('subDuration') && (
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
                    )}
                    {isColumnVisible('jobListings') && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => fetchJobListings(employer.employerId, employer.name)}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          disabled={loadingJobListings}
                        >
                          {employer.jobListingsCount || 0}
                        </button>
                      </td>
                    )}
                    {isColumnVisible('hired') && (
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{employer.hiredCount || 0}</span>
                        {employer.currentHires > 0 && (
                          <span className="text-xs text-green-600 ml-1">({employer.currentHires} active)</span>
                        )}
                      </td>
                    )}
                    {isColumnVisible('joined') && (
                      <td className="px-4 py-3 text-gray-600">{new Date(employer.joinedDate).toLocaleDateString()}</td>
                    )}
                    {isColumnVisible('actions') && (
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
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-sm text-gray-600">
            Showing: {filteredEmployers.length} of {totalEmployers}
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
                            <span>Budget: ₹{Number(job.budget || 0).toLocaleString('en-IN')}</span>
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


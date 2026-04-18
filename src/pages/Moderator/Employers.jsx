import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardPage from '../../components/DashboardPage';
import SmartFilter from '../../components/SmartFilter';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';
import { useChatContext } from '../../context/ChatContext';
import { graphqlQuery } from '../../utils/graphqlClient';
import { getBackendBaseUrl } from '../../utils/backendBaseUrl';

const API_BASE_URL = getBackendBaseUrl();

const serializeQueryParams = (params) => {
  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    searchParams.append(key, String(value));
  });

  return searchParams.toString();
};

const MODERATOR_EMPLOYERS_QUERY = `
  query ModeratorEmployers(
    $first: Int!
    $after: String
    $page: Int
    $search: String
    $sortBy: String
    $nameIn: [String]
    $companyIn: [String]
    $emailIn: [String]
    $phoneIn: [String]
    $ratingIn: [String]
    $subscribedIn: [String]
    $durationIn: [String]
  ) {
    moderatorEmployers(
      first: $first
      after: $after
      page: $page
      search: $search
      sortBy: $sortBy
      nameIn: $nameIn
      companyIn: $companyIn
      emailIn: $emailIn
      phoneIn: $phoneIn
      ratingIn: $ratingIn
      subscribedIn: $subscribedIn
      durationIn: $durationIn
    ) {
      edges {
        cursor
        node {
          employerId userId name email phone picture location companyName rating subscription isPremium
          subscriptionDuration subscriptionExpiryDate jobListingsCount hiredCount currentHires pastHires joinedDate
        }
      }
      pageInfo { hasNextPage endCursor }
      total
    }
    moderatorEmployersMeta {
      filterOptions { names companies emails phones ratings subscribed durations }
    }
  }
`;

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
  const [metaFilters, setMetaFilters] = useState({ names: [], companies: [], emails: [], phones: [], ratings: [], subscribed: [], durations: [] });
  const [totalEmployersCount, setTotalEmployersCount] = useState(0);
  const [serverPagination, setServerPagination] = useState(null);
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(null);

  // Sort/filter state
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

  const filterSignature = JSON.stringify({
    debouncedSearchTerm,
    sortBy,
    nameFilters,
    companyFilters,
    emailFilters,
    phoneFilters,
    ratingFilters,
    subscribedFilters,
    durationFilters,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchEmployers(currentPage, pageSize);
  }, [currentPage, pageSize, filterSignature]);

  const fetchEmployers = async (page = currentPage, limit = pageSize) => {
    try {
      setLoading(true);
      setError(null);
      const result = await graphqlQuery(MODERATOR_EMPLOYERS_QUERY, {
        first: limit,
        page,
        search: debouncedSearchTerm || undefined,
        sortBy,
        nameIn: nameFilters.length ? nameFilters : null,
        companyIn: companyFilters.length ? companyFilters : null,
        emailIn: emailFilters.length ? emailFilters : null,
        phoneIn: phoneFilters.length ? phoneFilters : null,
        ratingIn: ratingFilters.length ? ratingFilters.map((v) => String(v)) : null,
        subscribedIn: subscribedFilters.length ? subscribedFilters : null,
        durationIn: durationFilters.length ? durationFilters.map((v) => String(v)) : null,
      });

      const connection = result?.moderatorEmployers;
      const edges = connection?.edges || [];

      setEmployers(edges.map((edge) => edge.node));
      setTotalEmployersCount(connection?.total || 0);
      setServerPagination(connection?.pageInfo || null);
      setMetaFilters(result?.moderatorEmployersMeta?.filterOptions || { names: [], companies: [], emails: [], phones: [], ratings: [], subscribed: [], durations: [] });
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
    setNameFilters([]);
    setCompanyFilters([]);
    setEmailFilters([]);
    setPhoneFilters([]);
    setRatingFilters([]);
    setSubscribedFilters([]);
    setDurationFilters([]);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '' ||
    nameFilters.length > 0 || companyFilters.length > 0 || emailFilters.length > 0 || phoneFilters.length > 0 ||
    ratingFilters.length > 0 || subscribedFilters.length > 0 || durationFilters.length > 0;

  const displayedEmployers = employers;

  // Calculate statistics
  const totalEmployers = totalEmployersCount || employers.length;
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

      <p className="text-gray-500 mt-1">View and manage all registered employers</p>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-building text-blue-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Employers</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{totalEmployers}</p>
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
              <i className="fas fa-list text-emerald-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Job Listings</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{totalJobListings}</p>
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
              onChange={(e) => {
                setCurrentPage(1);
                setSearchTerm(e.target.value);
              }}
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
          <button onClick={() => fetchEmployers(currentPage, pageSize)} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">Retry</button>
        </div>
      )}

      {!loading && !error && displayedEmployers.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-700 mb-1">No employers found</p>
          <p className="text-gray-500">{searchTerm || hasActiveFilters ? 'No employers match your filters.' : 'There are no registered employers.'}</p>
        </div>
      )}

      {!loading && !error && displayedEmployers.length > 0 && (
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
                          options={metaFilters.names}
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
                          options={metaFilters.companies}
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
                          options={metaFilters.emails}
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
                          options={metaFilters.phones}
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
                          options={metaFilters.ratings}
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
                          options={metaFilters.subscribed}
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
                          options={metaFilters.durations}
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
                {displayedEmployers.map((employer) => (
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
          <div className="px-4 py-3 text-sm text-gray-600 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                Showing {displayedEmployers.length} employers on page {currentPage} (total {totalEmployers})
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


import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import { useChatContext } from '../../context/ChatContext';
import SmartFilter from '../../components/SmartFilter';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';
import { graphqlQuery } from '../../utils/graphqlClient';

const ADMIN_EMPLOYERS_QUERY = `
  query AdminEmployers(
    $first: Int!
    $after: String
    $search: String
    $companyIn: [String!]
    $locationIn: [String!]
    $ratingIn: [Float!]
    $subscriptionIn: [String!]
    $sortBy: String
    $sortOrder: String
  ) {
    adminEmployers(
      first: $first
      after: $after
      search: $search
      companyIn: $companyIn
      locationIn: $locationIn
      ratingIn: $ratingIn
      subscriptionIn: $subscriptionIn
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      edges {
        cursor
        node { employerId userId name email phone picture location companyName rating subscription isPremium subscriptionDuration subscriptionExpiryDate jobListingsCount hiredCount currentHires pastHires joinedDate }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      total
    }
    adminEmployersMeta {
      summary {
        total
        premium
        totalJobListings
      }
      filterOptions {
        companies
        locations
        ratings
        subscriptions
      }
    }
  }
`;

const COLUMNS = [
  { key: 'photo',        label: 'Photo',        defaultVisible: true },
  { key: 'name',         label: 'Name',         defaultVisible: true },
  { key: 'email',        label: 'Email',        defaultVisible: true },
  { key: 'phone',        label: 'Phone',        defaultVisible: false },
  { key: 'company',      label: 'Company',      defaultVisible: true },
  { key: 'location',     label: 'Location',     defaultVisible: false },
  { key: 'rating',       label: 'Rating',       defaultVisible: true },
  { key: 'subscription', label: 'Subscription', defaultVisible: true },
  { key: 'jobs',         label: 'Job Listings', defaultVisible: false },
  { key: 'hired',        label: 'Hired',        defaultVisible: false },
  { key: 'joined',       label: 'Joined',       defaultVisible: true },
  { key: 'actions',      label: 'Actions',      defaultVisible: true },
];

const SORT_OPTIONS = [
  { value: 'date_desc',  label: 'Date (Newest First)' },
  { value: 'date_asc',   label: 'Date (Oldest First)' },
  { value: 'name_asc',   label: 'Name (A–Z)' },
  { value: 'name_desc',  label: 'Name (Z–A)' },
  { value: 'rating_desc', label: 'Rating (Highest)' },
  { value: 'rating_asc',  label: 'Rating (Lowest)' },
  { value: 'jobs_desc',  label: 'Job Listings (Most)' },
  { value: 'jobs_asc',   label: 'Job Listings (Least)' },
  { value: 'hired_desc', label: 'Hired (Most)' },
  { value: 'hired_asc',  label: 'Hired (Least)' },
];

const AVATAR_FALLBACK = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png';

const AdminEmployers = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openChatWith } = useChatContext();

  const [employers, setEmployers] = useState([]);
  const [totalEmployers, setTotalEmployers] = useState(0);
  const [metaSummary, setMetaSummary] = useState(null);
  const [metaFilters, setMetaFilters] = useState({ companies: [], locations: [], ratings: [], subscriptions: [] });
  const [serverPagination, setServerPagination] = useState(null);
  const [pageSize, setPageSize] = useState(() => {
    const urlLimit = Number(searchParams.get('limit') || '25');
    if (!Number.isFinite(urlLimit) || urlLimit < 1) return 25;
    return Math.min(100, urlLimit);
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [afterCursor, setAfterCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [sort, setSort]           = useState('date_desc');
  const [filters, setFilters]     = useState({ company: [], location: [], rating: [], subscription: [] });
  const { visible, setVisible } = useSmartColumnToggle(COLUMNS, 'admin-employers-columns');

  const setFilter = (key) => (vals) => setFilters((p) => ({ ...p, [key]: vals }));
  const hasFilters = Object.values(filters).some((v) => v.length > 0);

  const [sortField, sortDir] = sort.split('_');
  const mappedSortBy =
    sortField === 'date'
      ? 'createdAt'
      : sortField === 'name'
        ? 'name'
        : sortField === 'rating'
          ? 'rating'
          : sortField === 'jobs'
            ? 'jobListingsCount'
            : 'hiredCount';

  const filterSignature = JSON.stringify({
    search,
    sortBy: mappedSortBy,
    sortOrder: sortDir,
    filters,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      resetAndFetchEmployers();
    }, 250);

    return () => clearTimeout(timer);
  }, [pageSize, filterSignature]);

  useEffect(() => {
    const urlLimit = Number(searchParams.get('limit') || '25');
    if (Number.isFinite(urlLimit) && urlLimit > 0 && urlLimit !== pageSize) {
      setPageSize(Math.min(100, urlLimit));
    }
  }, [searchParams]);

  const fetchEmployers = async ({ after = afterCursor } = {}) => {
    setLoading(true);
    try {
      const result = await graphqlQuery(ADMIN_EMPLOYERS_QUERY, {
        first: pageSize,
        after,
        search: search.trim() || null,
        companyIn: filters.company.length ? filters.company : null,
        locationIn: filters.location.length ? filters.location : null,
        ratingIn: filters.rating.length
          ? filters.rating.map((value) => Number(value)).filter((value) => Number.isFinite(value))
          : null,
        subscriptionIn: filters.subscription.length ? filters.subscription : null,
        sortBy: mappedSortBy,
        sortOrder: sortDir,
      });

      const connection = result?.adminEmployers;
      const edges = connection?.edges || [];

      setEmployers(edges.map((edge) => edge.node));
      setTotalEmployers(connection?.total || 0);
      setMetaSummary(result?.adminEmployersMeta?.summary || null);
      setMetaFilters(result?.adminEmployersMeta?.filterOptions || { companies: [], locations: [], ratings: [], subscriptions: [] });
      setServerPagination({
        hasNextPage: connection?.pageInfo?.hasNextPage || false,
        endCursor: connection?.pageInfo?.endCursor || null,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const resetAndFetchEmployers = async () => {
    setCurrentPage(1);
    setAfterCursor(null);
    setCursorStack([]);
    await fetchEmployers({ after: null });
  };

  const handleNextPage = async () => {
    if (!serverPagination?.hasNextPage || !serverPagination?.endCursor) return;
    const nextAfter = serverPagination.endCursor;
    setCursorStack((prev) => [...prev, afterCursor]);
    setAfterCursor(nextAfter);
    setCurrentPage((p) => p + 1);
    await fetchEmployers({ after: nextAfter });
  };

  const handlePrevPage = async () => {
    if (currentPage <= 1) return;
    const nextStack = [...cursorStack];
    const prevAfter = nextStack.pop() ?? null;
    setCursorStack(nextStack);
    setAfterCursor(prevAfter);
    setCurrentPage((p) => Math.max(1, p - 1));
    await fetchEmployers({ after: prevAfter });
  };

  const handlePageSizeChange = (nextSize) => {
    const normalized = Math.min(100, Math.max(1, Number(nextSize) || 25));
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      updated.set('limit', String(normalized));
      return updated;
    });
    setPageSize(normalized);
  };

  const displayedEmployers = employers;

  const premium   = metaSummary?.premium ?? employers.filter((e) => e.isPremium).length;
  const totalJobs = metaSummary?.totalJobListings ?? employers.reduce((s, e) => s + (e.jobListingsCount || 0), 0);

  return (
    <DashboardPage title="Employers">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Employers',    value: metaSummary?.total ?? totalEmployers ?? employers.length, iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> },
          { label: 'Total Job Listings', value: totalJobs,        iconBg: 'bg-green-100',  iconColor: 'text-green-600',  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
          { label: 'Premium Members',    value: premium,          iconBg: 'bg-purple-100', iconColor: 'text-purple-600', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /> },
          { label: 'Showing',            value: displayedEmployers.length,  iconBg: 'bg-orange-100', iconColor: 'text-orange-600', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
              <svg className={`w-5 h-5 ${s.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{s.icon}</svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input type="text" placeholder="Search by name, email, company, or location…"
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <SmartColumnToggle columns={COLUMNS} visible={visible} onChange={setVisible}
            storageKey="admin-employers-columns" label="Columns" />
          {hasFilters && (
            <button onClick={() => setFilters({ company: [], location: [], rating: [], subscription: [] })}
              className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[calc(90vh-20rem)] flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            {!loading && (
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  {visible.has('photo')        && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Photo</th>}
                  {visible.has('name')         && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>}
                  {visible.has('email')        && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>}
                  {visible.has('phone')        && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>}
                  {visible.has('company')      && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">Company
                        <SmartFilter label="Company" data={employers} field="companyName"
                          selectedValues={filters.company} onFilterChange={setFilter('company')} options={metaFilters?.companies || []} />
                      </div>
                    </th>
                  )}
                  {visible.has('location')     && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">Location
                        <SmartFilter label="Location" data={employers} field="location"
                          selectedValues={filters.location} onFilterChange={setFilter('location')} options={metaFilters?.locations || []} />
                      </div>
                    </th>
                  )}
                  {visible.has('rating')       && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">Rating
                        <SmartFilter label="Rating" data={employers} field="rating"
                          selectedValues={filters.rating} onFilterChange={setFilter('rating')}
                          valueFormatter={(v) => `★ ${Number(v).toFixed(1)}`} options={metaFilters?.ratings || []} />
                      </div>
                    </th>
                  )}
                  {visible.has('subscription') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">Subscription
                        <SmartFilter label="Subscription" data={employers} field="subscription"
                          selectedValues={filters.subscription} onFilterChange={setFilter('subscription')} options={metaFilters?.subscriptions || []} />
                      </div>
                    </th>
                  )}
                  {visible.has('jobs')         && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Job Listings</th>}
                  {visible.has('hired')        && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Hired</th>}
                  {visible.has('joined')       && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>}
                  {visible.has('actions')      && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={visible.size} className="px-4 py-12 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></span>
                      <span>Loading employers...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedEmployers.length > 0 ? displayedEmployers.map((emp) => (
                <tr key={emp.employerId} className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/employers/${emp.employerId}`)}>
                  {visible.has('photo')        && (
                    <td className="px-4 py-3">
                      <img src={emp.picture || AVATAR_FALLBACK} alt={emp.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        onError={(e) => { e.target.src = AVATAR_FALLBACK; }} />
                    </td>
                  )}
                  {visible.has('name')         && <td className="px-4 py-3 font-medium text-gray-900 text-sm">{emp.name}</td>}
                  {visible.has('email')        && <td className="px-4 py-3 text-sm text-gray-600">{emp.email}</td>}
                  {visible.has('phone')        && <td className="px-4 py-3 text-sm text-gray-600">{emp.phone && emp.phone !== 'N/A' ? emp.phone : '—'}</td>}
                  {visible.has('company')      && (
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {emp.companyName && emp.companyName !== 'N/A' ? emp.companyName : '—'}
                    </td>
                  )}
                  {visible.has('location')     && <td className="px-4 py-3 text-sm text-gray-600">{emp.location && emp.location !== 'N/A' ? emp.location : '—'}</td>}
                  {visible.has('rating')       && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500 text-xs">★</span>
                        <span className="font-medium text-gray-900 text-sm">{Number(emp.rating || 0).toFixed(1)}</span>
                      </div>
                    </td>
                  )}
                  {visible.has('subscription') && (
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        emp.subscription === 'Premium' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                      }`}>{emp.subscription || 'Basic'}</span>
                    </td>
                  )}
                  {visible.has('jobs')         && <td className="px-4 py-3 text-sm text-gray-700 font-medium">{emp.jobListingsCount ?? 0}</td>}
                  {visible.has('hired')        && (
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="font-medium">{emp.hiredCount ?? 0}</span>
                      {emp.currentHires > 0 && <span className="text-xs text-green-600 ml-1">({emp.currentHires} active)</span>}
                    </td>
                  )}
                  {visible.has('joined')       && <td className="px-4 py-3 text-sm text-gray-500">{emp.joinedDate ? new Date(emp.joinedDate).toLocaleDateString() : 'N/A'}</td>}
                  {visible.has('actions')      && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button onClick={() => openChatWith(emp.userId)}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 transition-colors">Chat</button>
                        <button onClick={() => navigate(`/admin/employers/${emp.employerId}`)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors">View</button>
                      </div>
                    </td>
                  )}
                </tr>
              )) : (
                <tr><td colSpan={visible.size} className="px-4 py-12 text-center text-gray-400">No employers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 mt-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing {displayedEmployers.length} employers on page {currentPage} (total {metaSummary?.total ?? totalEmployers ?? employers.length})
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Rows:</label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-xs"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <button
                onClick={handlePrevPage}
                disabled={loading || currentPage <= 1}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={loading || !serverPagination?.hasNextPage}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
};

export default AdminEmployers;

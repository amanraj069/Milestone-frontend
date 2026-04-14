import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import { useChatContext } from '../../context/ChatContext';
import SmartFilter from '../../components/SmartFilter';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';
import { graphqlQuery } from '../../utils/graphqlClient';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const ADMIN_MODERATORS_QUERY = `
  query AdminModerators(
    $first: Int!
    $after: String
    $search: String
    $locationIn: [String!]
    $sortBy: String
    $sortOrder: String
  ) {
    adminModerators(
      first: $first
      after: $after
      search: $search
      locationIn: $locationIn
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      edges {
        cursor
        node {
          moderatorId
          userId
          name
          email
          picture
          location
          joinedDate
          complaintsResolved
          totalComplaints
          blogsCreated
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      total
    }
    adminModeratorsMeta {
      summary {
        total
        complaintsResolved
        totalComplaints
        blogsCreated
      }
      filterOptions {
        locations
      }
    }
  }
`;

const MOD_COLUMNS = [
  { key: 'photo', label: 'Photo', defaultVisible: true },
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'location', label: 'Location', defaultVisible: true },
  { key: 'joined', label: 'Joined', defaultVisible: true },
  { key: 'actions', label: 'Actions', defaultVisible: true },
];

const MOD_SORT_OPTIONS = [
  { value: 'date_desc', label: 'Date (Newest First)' },
  { value: 'date_asc', label: 'Date (Oldest First)' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
];

const AVATAR_FALLBACK = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png';

const Avatar = ({ src, name }) => (
  <img
    src={src || AVATAR_FALLBACK}
    alt={name}
    className="w-10 h-10 rounded-full object-cover border border-gray-200"
    onError={(e) => { e.target.src = AVATAR_FALLBACK; }}
  />
);

const AdminModerators = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { openChatWith } = useChatContext();

  const [moderators, setModerators] = useState([]);
  const [totalModerators, setTotalModerators] = useState(0);
  const [metaSummary, setMetaSummary] = useState(null);
  const [metaFilters, setMetaFilters] = useState({ locations: [] });
  const [serverPagination, setServerPagination] = useState(null);
  const [pageSize, setPageSize] = useState(() => {
    const urlLimit = Number(searchParams.get('limit') || '25');
    if (!Number.isFinite(urlLimit) || urlLimit < 1) return 25;
    return Math.min(100, urlLimit);
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [afterCursor, setAfterCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([]);
  const [modLoading, setModLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [modSearch, setModSearch] = useState('');
  const [modSort, setModSort] = useState('date_desc');
  const [modFilters, setModFilters] = useState({ location: [] });
  const { visible: modVisible, setVisible: setModVisible } = useSmartColumnToggle(MOD_COLUMNS, 'admin-moderators-columns');

  const [modSortField, modSortDir] = modSort.split('_');
  const mappedSortBy = modSortField === 'date' ? 'createdAt' : 'name';

  const filterSignature = JSON.stringify({
    modSearch,
    modSort,
    modFilters,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      resetAndFetchModerators();
    }, 250);

    return () => clearTimeout(timer);
  }, [pageSize, filterSignature]);

  useEffect(() => {
    const urlLimit = Number(searchParams.get('limit') || '25');
    if (Number.isFinite(urlLimit) && urlLimit > 0 && urlLimit !== pageSize) {
      setPageSize(Math.min(100, urlLimit));
    }
  }, [searchParams]);

  const syncParams = (nextLimit) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      updated.set('limit', String(nextLimit));
      return updated;
    });
  };

  const fetchModerators = async ({ after = afterCursor } = {}) => {
    try {
      setModLoading(true);
      const result = await graphqlQuery(ADMIN_MODERATORS_QUERY, {
        first: pageSize,
        after,
        search: modSearch.trim() || null,
        locationIn: modFilters.location.length ? modFilters.location : null,
        sortBy: mappedSortBy,
        sortOrder: modSortDir,
      });

      const connection = result?.adminModerators;
      const edges = connection?.edges || [];

      setModerators(edges.map((edge) => edge.node));
      setTotalModerators(connection?.total || 0);
      setMetaSummary(result?.adminModeratorsMeta?.summary || null);
      setMetaFilters(result?.adminModeratorsMeta?.filterOptions || { locations: [] });
      setServerPagination({
        hasNextPage: connection?.pageInfo?.hasNextPage || false,
        endCursor: connection?.pageInfo?.endCursor || null,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setModLoading(false);
    }
  };

  const resetAndFetchModerators = async () => {
    setCurrentPage(1);
    setAfterCursor(null);
    setCursorStack([]);
    await fetchModerators({ after: null });
  };

  const handleDeleteModerator = async (moderatorId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/moderators/${moderatorId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        await fetchModerators({ after: afterCursor });
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePrevPage = async () => {
    if (currentPage <= 1 || modLoading) return;
    const nextStack = [...cursorStack];
    const prevAfter = nextStack.pop() ?? null;
    setCursorStack(nextStack);
    setAfterCursor(prevAfter);
    setCurrentPage((p) => Math.max(1, p - 1));
    await fetchModerators({ after: prevAfter });
  };

  const handleNextPage = async () => {
    if (modLoading || !serverPagination?.hasNextPage || !serverPagination?.endCursor) return;
    const nextAfter = serverPagination.endCursor;
    setCursorStack((prev) => [...prev, afterCursor]);
    setAfterCursor(nextAfter);
    setCurrentPage((p) => p + 1);
    await fetchModerators({ after: nextAfter });
  };

  const handlePageSizeChange = (nextSize) => {
    const normalized = Math.min(100, Math.max(1, Number(nextSize) || 25));
    syncParams(normalized);
    setPageSize(normalized);
  };

  const displayedModerators = moderators;

  const totalResolved = metaSummary?.complaintsResolved ?? moderators.reduce((sum, item) => sum + (item.complaintsResolved || 0), 0);
  const totalComplaints = metaSummary?.totalComplaints ?? moderators.reduce((sum, item) => sum + (item.totalComplaints || 0), 0);
  const blogsCreated = metaSummary?.blogsCreated ?? moderators.reduce((sum, item) => sum + (item.blogsCreated || 0), 0);

  return (
    <DashboardPage title="Moderator Management">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Moderators', value: metaSummary?.total ?? totalModerators ?? moderators.length, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
          { label: 'Complaints Resolved', value: totalResolved, iconBg: 'bg-green-100', iconColor: 'text-green-600', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
          { label: 'Total Complaints', value: totalComplaints, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
          { label: 'Blogs Created', value: blogsCreated, iconBg: 'bg-purple-100', iconColor: 'text-purple-600', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
              <svg className={`w-5 h-5 ${stat.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{stat.icon}</svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, email, or location..."
              value={modSearch}
              onChange={(e) => setModSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <select
            value={modSort}
            onChange={(e) => setModSort(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {MOD_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <SmartColumnToggle
            columns={MOD_COLUMNS}
            visible={modVisible}
            onChange={setModVisible}
            storageKey="admin-moderators-columns"
            label="Columns"
          />
          {modFilters.location.length > 0 && (
            <button
              onClick={() => setModFilters({ location: [] })}
              className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {modLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-[calc(90vh-20rem)] flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {modVisible.has('photo') && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Photo</th>}
                  {modVisible.has('name') && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>}
                  {modVisible.has('email') && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>}
                  {modVisible.has('location') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">Location
                        <SmartFilter
                          label="Location"
                          data={moderators}
                          field="location"
                          selectedValues={modFilters.location}
                          onFilterChange={(values) => setModFilters((prev) => ({ ...prev, location: values }))}
                          options={metaFilters?.locations || []}
                        />
                      </div>
                    </th>
                  )}
                  {modVisible.has('joined') && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>}
                  {modVisible.has('actions') && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedModerators.length > 0 ? displayedModerators.map((moderator) => (
                  <tr
                    key={moderator.moderatorId}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/moderators/${moderator.moderatorId}`)}
                  >
                    {modVisible.has('photo') && <td className="px-4 py-3"><Avatar src={moderator.picture} name={moderator.name} /></td>}
                    {modVisible.has('name') && <td className="px-4 py-3 font-medium text-gray-900 text-sm">{moderator.name}</td>}
                    {modVisible.has('email') && <td className="px-4 py-3 text-sm text-gray-600">{moderator.email}</td>}
                    {modVisible.has('location') && <td className="px-4 py-3 text-sm text-gray-600">{moderator.location && moderator.location !== 'N/A' ? moderator.location : '-'}</td>}
                    {modVisible.has('joined') && <td className="px-4 py-3 text-sm text-gray-500">{moderator.joinedDate ? new Date(moderator.joinedDate).toLocaleDateString() : 'N/A'}</td>}
                    {modVisible.has('actions') && (
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openChatWith(moderator.userId)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 transition-colors"
                          >
                            Chat
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(moderator.moderatorId)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={modVisible.size} className="px-4 py-12 text-center text-gray-400">No moderators found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 mt-auto">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                Showing {displayedModerators.length} moderators on page {currentPage} (total {metaSummary?.total ?? totalModerators ?? moderators.length})
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
                  disabled={modLoading || currentPage <= 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={modLoading || !serverPagination?.hasNextPage}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Moderator</h3>
            <p className="text-sm text-gray-600 mb-4">This will permanently delete this moderator and their user account. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Cancel</button>
              <button onClick={() => handleDeleteModerator(deleteConfirm)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </DashboardPage>
  );
};

export default AdminModerators;

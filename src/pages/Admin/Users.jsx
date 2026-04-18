import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import RatingAdjustmentModal from '../../components/RatingAdjustmentModal';
import RatingHistoryModal from '../../components/RatingHistoryModal';
import SmartFilter from '../../components/SmartFilter';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';
import { graphqlQuery } from '../../utils/graphqlClient';
import { getBackendBaseUrl } from '../../utils/backendBaseUrl';

const API_BASE = getBackendBaseUrl();

const ADMIN_USERS_PAGINATED_QUERY = `
  query AdminUsersPaginated(
    $first: Int!
    $after: String
    $search: String
    $roleIn: [String!]
    $subscriptionIn: [String!]
    $locationIn: [String!]
    $ratingIn: [Float!]
    $sortBy: String
    $sortOrder: String
  ) {
    adminUsers(
      first: $first
      after: $after
      search: $search
      roleIn: $roleIn
      subscriptionIn: $subscriptionIn
      locationIn: $locationIn
      ratingIn: $ratingIn
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      edges {
        cursor
        node {
          userId
          name
          email
          role
          subscription
          picture
          location
          rating
          createdAt
          roleId
          profilePath
          subscriptionDuration
          subscriptionExpiryDate
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      total
    }
    adminUsersMeta {
      summary {
        total
        freelancers
        employers
        moderators
        admins
      }
      filterOptions {
        roles
        subscriptions
        locations
        ratings
      }
    }
  }
`;

const COLUMNS = [
  { key: 'user',         label: 'User',         defaultVisible: true },
  { key: 'email',        label: 'Email',        defaultVisible: true },
  { key: 'role',         label: 'Role',         defaultVisible: true },
  { key: 'subscription', label: 'Subscription', defaultVisible: true },
  { key: 'rating',       label: 'Rating',       defaultVisible: true },
  { key: 'location',     label: 'Location',     defaultVisible: false },
  { key: 'joined',       label: 'Joined',       defaultVisible: true },
  { key: 'actions',      label: 'Actions',      defaultVisible: true },
];

const AdminUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [serverPagination, setServerPagination] = useState(null);
  const [metaSummary, setMetaSummary] = useState(null);
  const [metaFilters, setMetaFilters] = useState({ roles: [], subscriptions: [], locations: [], ratings: [] });
  const [pageSize, setPageSize] = useState(() => {
    const urlLimit = Number(searchParams.get('limit') || '25');
    if (!Number.isFinite(urlLimit) || urlLimit < 1) return 25;
    return Math.min(100, urlLimit);
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [afterCursor, setAfterCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [columnFilters, setColumnFilters] = useState({ role: [], subscription: [], rating: [], location: [] });
  const { visible, setVisible } = useSmartColumnToggle(COLUMNS, 'admin-users-columns');

  const setColFilter = (field) => (values) =>
    setColumnFilters((prev) => ({ ...prev, [field]: values }));
  
  // Rating adjustment modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const mappedSortBy =
    sortBy === 'date' ? 'createdAt' : sortBy === 'name' ? 'name' : 'rating';

  const filterSignature = JSON.stringify({
    searchTerm,
    sortBy: mappedSortBy,
    sortOrder,
    columnFilters,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      resetAndFetchUsers();
    }, 250);

    return () => clearTimeout(timer);
  }, [pageSize, filterSignature]);

  useEffect(() => {
    const urlLimit = Number(searchParams.get('limit') || '25');
    if (Number.isFinite(urlLimit) && urlLimit > 0 && urlLimit !== pageSize) {
      setPageSize(Math.min(100, urlLimit));
    }
  }, [searchParams]);

  const fetchUsers = async ({ after = afterCursor } = {}) => {
    setLoading(true);
    try {
      const result = await graphqlQuery(ADMIN_USERS_PAGINATED_QUERY, {
        first: pageSize,
        after,
        search: searchTerm.trim() || null,
        roleIn: columnFilters.role.length ? columnFilters.role : null,
        subscriptionIn: columnFilters.subscription.length
          ? columnFilters.subscription
          : null,
        locationIn: columnFilters.location.length ? columnFilters.location : null,
        ratingIn: columnFilters.rating.length
          ? columnFilters.rating
              .map((value) => Number(value))
              .filter((value) => Number.isFinite(value))
          : null,
        sortBy: mappedSortBy,
        sortOrder,
      });

      const connection = result?.adminUsers;
      const edges = connection?.edges || [];

      setUsers(edges.map((edge) => edge.node));
      setTotalUsers(connection?.total || 0);
      setMetaSummary(result?.adminUsersMeta?.summary || null);
      setMetaFilters(result?.adminUsersMeta?.filterOptions || { roles: [], subscriptions: [], locations: [], ratings: [] });
      setServerPagination({
        hasNextPage: connection?.pageInfo?.hasNextPage || false,
        endCursor: connection?.pageInfo?.endCursor || null,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetAndFetchUsers = async () => {
    setCurrentPage(1);
    setAfterCursor(null);
    setCursorStack([]);
    await fetchUsers({ after: null });
  };

  const handleNextPage = async () => {
    if (!serverPagination?.hasNextPage || !serverPagination?.endCursor) return;
    const nextAfter = serverPagination.endCursor;
    setCursorStack((prev) => [...prev, afterCursor]);
    setAfterCursor(nextAfter);
    setCurrentPage((p) => p + 1);
    await fetchUsers({ after: nextAfter });
  };

  const handlePrevPage = async () => {
    if (currentPage <= 1) return;
    const nextStack = [...cursorStack];
    const prevAfter = nextStack.pop() ?? null;
    setCursorStack(nextStack);
    setAfterCursor(prevAfter);
    setCurrentPage((p) => Math.max(1, p - 1));
    await fetchUsers({ after: prevAfter });
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

  const handleDelete = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        fetchUsers();
        setDeleteConfirm(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleAdjustRating = (user) => {
    setSelectedUser({
      userId: user.userId,
      name: user.name,
      role: user.role,
      rating: user.rating || 4.5,
      email: user.email,
      picture: user.picture
    });
    setShowRatingModal(true);
  };

  const handleViewHistory = (user) => {
    setSelectedUser({
      userId: user.userId,
      name: user.name
    });
    setShowHistoryModal(true);
  };

  const handleRatingAdjustmentSuccess = (data) => {
    // Refresh users to get updated rating
    fetchUsers();
    setShowRatingModal(false);
  };

  const roleColors = {
    Freelancer: 'bg-blue-100 text-blue-700',
    Employer: 'bg-green-100 text-green-700',
    Moderator: 'bg-purple-100 text-purple-700',
    Admin: 'bg-red-100 text-red-700',
  };

  const roleCounts = {
    Freelancer: metaSummary?.freelancers ?? users.filter(u => u.role === 'Freelancer').length,
    Employer: metaSummary?.employers ?? users.filter(u => u.role === 'Employer').length,
    Moderator: metaSummary?.moderators ?? users.filter(u => u.role === 'Moderator').length,
    Admin: metaSummary?.admins ?? users.filter(u => u.role === 'Admin').length,
  };

  return (
    <DashboardPage title="User Management">
      {/* Stats */}
      {(() => {
        const roleIconMap = {
          Freelancer: { iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
          Employer:   { iconBg: 'bg-green-100',  iconColor: 'text-green-600',  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> },
          Moderator:  { iconBg: 'bg-orange-100', iconColor: 'text-orange-600', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
          Admin:      { iconBg: 'bg-red-100',    iconColor: 'text-red-600',    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
        };
        return (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Total</p>
                <p className="text-2xl font-bold text-gray-900">{metaSummary?.total ?? totalUsers ?? users.length}</p>
              </div>
            </div>
            {Object.entries(roleCounts).map(([role, count]) => {
              const ri = roleIconMap[role] || { iconBg: 'bg-gray-100', iconColor: 'text-gray-600', icon: null };
              return (
                <div key={role} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl ${ri.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <svg className={`w-5 h-5 ${ri.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{ri.icon}</svg>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500">{role}s</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by name, email, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          {/* Single consolidated sort dropdown */}
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('_');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="date_desc">Date (Newest First)</option>
            <option value="date_asc">Date (Oldest First)</option>
            <option value="name_asc">Name (A–Z)</option>
            <option value="name_desc">Name (Z–A)</option>
            <option value="rating_desc">Rating (Highest)</option>
            <option value="rating_asc">Rating (Lowest)</option>
          </select>
          {/* Column visibility toggle */}
          <SmartColumnToggle
            columns={COLUMNS}
            visible={visible}
            onChange={setVisible}
            storageKey="admin-users-columns"
            label="Columns"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-[calc(90vh-20rem)] flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            {!loading && (
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {visible.has('user') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                  )}
                  {visible.has('email') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  )}
                  {visible.has('role') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Role
                        <SmartFilter
                          label="Role"
                          data={users}
                          field="role"
                          selectedValues={columnFilters.role}
                          onFilterChange={setColFilter('role')}
                          options={metaFilters?.roles || []}
                        />
                      </div>
                    </th>
                  )}
                  {visible.has('subscription') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Subscription
                        <SmartFilter
                          label="Subscription"
                          data={users}
                          field="subscription"
                          selectedValues={columnFilters.subscription}
                          onFilterChange={setColFilter('subscription')}
                          options={metaFilters?.subscriptions || []}
                        />
                      </div>
                    </th>
                  )}
                  {visible.has('rating') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Rating
                        <SmartFilter
                          label="Rating"
                          data={users}
                          field="rating"
                          selectedValues={columnFilters.rating}
                          onFilterChange={setColFilter('rating')}
                          valueFormatter={(v) => `★ ${Number(v).toFixed(1)}`}
                          options={metaFilters?.ratings || []}
                        />
                      </div>
                    </th>
                  )}
                  {visible.has('location') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Location
                        <SmartFilter
                          label="Location"
                          data={users}
                          field="location"
                          selectedValues={columnFilters.location}
                          onFilterChange={setColFilter('location')}
                          options={metaFilters?.locations || []}
                        />
                      </div>
                    </th>
                  )}
                  {visible.has('joined') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  )}
                  {visible.has('actions') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  )}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={visible.size} className="px-4 py-12 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></span>
                      <span>Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.userId} className="hover:bg-gray-50 transition-colors">
                    {visible.has('user') && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                            <img
                              src={u.picture || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'}
                              alt={u.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'; }}
                            />
                          </div>
                          <div>
                            <span className="font-medium text-gray-900 text-sm">{u.name || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                    )}
                    {visible.has('email') && (
                      <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    )}
                    {visible.has('role') && (
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-gray-100 text-gray-600'}`}>
                          {u.role}
                        </span>
                      </td>
                    )}
                    {visible.has('subscription') && (
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.subscription === 'Premium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {u.subscription === 'Premium' && <i className="fas fa-crown mr-1 text-[10px]"></i>}
                          {u.subscription}
                        </span>
                      </td>
                    )}
                    {visible.has('rating') && (
                      <td className="px-4 py-3 text-sm">
                        {(u.role === 'Moderator' || u.role === 'Admin')
                          ? <span className="text-gray-300 text-xs">—</span>
                          : <><span className="text-yellow-500"><i className="fas fa-star text-[10px] mr-1"></i></span>{u.rating?.toFixed(1) || 'N/A'}</>
                        }
                      </td>
                    )}
                    {visible.has('location') && (
                      <td className="px-4 py-3 text-sm text-gray-500">{u.location || 'N/A'}</td>
                    )}
                    {visible.has('joined') && (
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    )}
                    {visible.has('actions') && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {
                            (u.role === 'Moderator' || u.role === 'Admin') ? (
                              <>
                                <button
                                  disabled
                                  title="Unavailable for this role"
                                  className="px-3 py-1.5 bg-gray-100 text-gray-300 rounded-lg text-xs font-medium cursor-not-allowed inline-flex items-center gap-1"
                                >
                                  <i className="fas fa-adjust"></i>
                                  Rating
                                </button>
                                <button
                                  disabled
                                  title="Unavailable for this role"
                                  className="px-3 py-1.5 bg-gray-100 text-gray-300 rounded-lg text-xs font-medium cursor-not-allowed inline-flex items-center gap-1"
                                >
                                  <i className="fas fa-history"></i>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleAdjustRating(u)}
                                  className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors inline-flex items-center gap-1"
                                  title="Adjust Rating"
                                >
                                  <i className="fas fa-adjust"></i>
                                  Rating
                                </button>
                                <button
                                  onClick={() => handleViewHistory(u)}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors inline-flex items-center gap-1"
                                  title="View Rating History"
                                >
                                  <i className="fas fa-history"></i>
                                </button>
                              </>
                            )
                          }
                          <button
                            onClick={() => setDeleteConfirm(u.userId)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                            title="Delete User"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visible.size} className="px-4 py-12 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 mt-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing {users.length} users on page {currentPage} (total {totalUsers || users.length})
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete User</h3>
            <p className="text-sm text-gray-600 mb-4">This will permanently delete this user and all their associated data. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Adjustment Modal */}
      <RatingAdjustmentModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        user={selectedUser}
        onSuccess={handleRatingAdjustmentSuccess}
      />

      {/* Rating History Modal */}
      <RatingHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        userId={selectedUser?.userId}
        userName={selectedUser?.name}
      />
    </DashboardPage>
  );
};

export default AdminUsers;

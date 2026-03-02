import React, { useState, useEffect } from 'react';
import DashboardPage from '../../components/DashboardPage';
import RatingAdjustmentModal from '../../components/RatingAdjustmentModal';
import RatingHistoryModal from '../../components/RatingHistoryModal';
import SmartFilter from '../../components/SmartFilter';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

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
  const [users, setUsers] = useState([]);
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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setUsers(users.filter(u => u.userId !== userId));
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

  const filtered = users
    .filter((u) => {
      if (columnFilters.role.length > 0 && !columnFilters.role.includes(u.role)) return false;
      if (columnFilters.subscription.length > 0 && !columnFilters.subscription.includes(u.subscription)) return false;
      if (columnFilters.rating.length > 0 && !columnFilters.rating.includes(u.rating)) return false;
      if (columnFilters.location.length > 0 && !columnFilters.location.includes(u.location)) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term) || u.location?.toLowerCase().includes(term);
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = new Date(a.createdAt) - new Date(b.createdAt);
      else if (sortBy === 'name') cmp = (a.name || '').localeCompare(b.name || '');
      else if (sortBy === 'rating') cmp = (a.rating || 0) - (b.rating || 0);
      return sortOrder === 'desc' ? -cmp : cmp;
    });

  const roleColors = {
    Freelancer: 'bg-blue-100 text-blue-700',
    Employer: 'bg-green-100 text-green-700',
    Moderator: 'bg-purple-100 text-purple-700',
    Admin: 'bg-red-100 text-red-700',
  };

  const roleCounts = {
    Freelancer: users.filter(u => u.role === 'Freelancer').length,
    Employer: users.filter(u => u.role === 'Employer').length,
    Moderator: users.filter(u => u.role === 'Moderator').length,
    Admin: users.filter(u => u.role === 'Admin').length,
  };

  if (loading) {
    return (
      <DashboardPage title="User Management">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading users...</p>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="User Management">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        {Object.entries(roleCounts).map(([role, count]) => (
          <div key={role} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
            <p className="text-xs font-medium text-gray-500 uppercase">{role}s</p>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
          </div>
        ))}
      </div>

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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
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
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((u) => (
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
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
          Showing {filtered.length} of {users.length} users
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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import { useChatContext } from '../../context/ChatContext';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const AdminModerators = () => {
  const [moderators, setModerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { openChatWith } = useChatContext();

  useEffect(() => {
    fetchModerators();
  }, []);

  const fetchModerators = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/moderators`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setModerators(data.moderators);
      }
    } catch (error) {
      console.error('Error fetching moderators:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (moderatorId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/moderators/${moderatorId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setModerators(moderators.filter(m => m.moderatorId !== moderatorId));
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Error deleting moderator:', error);
    }
  };

  const filtered = moderators.filter((m) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return m.name?.toLowerCase().includes(term) || m.email?.toLowerCase().includes(term) || m.location?.toLowerCase().includes(term);
  });

  const totalResolved = moderators[0]?.complaintsResolved || 0;
  const totalComplaints = moderators[0]?.totalComplaints || 0;

  if (loading) {
    return (
      <DashboardPage title="Moderator Management">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading moderators...</p>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="Moderator Management">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Moderators</p>
          <p className="text-2xl font-bold text-gray-900">{moderators.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Complaints Resolved</p>
          <p className="text-2xl font-bold text-green-600">{totalResolved}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Complaints</p>
          <p className="text-2xl font-bold text-orange-600">{totalComplaints}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Blogs Created</p>
          <p className="text-2xl font-bold text-blue-600">{moderators[0]?.blogsCreated || 0}</p>
        </div>
      </div>

      {/* Search */}
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
          <div className="text-sm text-gray-500">
            Showing: {filtered.length} of {moderators.length}
          </div>
        </div>
      </div>

      {/* Moderators Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Photo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((mod) => (
                  <tr
                    key={mod.moderatorId}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/moderators/${mod.moderatorId}`)}
                  >
                    <td className="px-4 py-3">
                      <img
                        src={mod.picture || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'}
                        alt={mod.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        onError={(e) => { e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'; }}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 text-sm">{mod.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{mod.email}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500"><i className="fas fa-star text-[10px]"></i></span>
                        <span className="font-medium text-gray-900">{mod.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{mod.location && mod.location !== 'N/A' ? mod.location : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {mod.joinedDate ? new Date(mod.joinedDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openChatWith(mod.userId)}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-medium hover:bg-emerald-700 transition-colors"
                        >
                          Chat
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(mod.moderatorId)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
                    No moderators found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
          Showing {filtered.length} of {moderators.length} moderators
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Moderator</h3>
            <p className="text-sm text-gray-600 mb-4">This will permanently delete this moderator and their user account. This action cannot be undone.</p>
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
    </DashboardPage>
  );
};

export default AdminModerators;

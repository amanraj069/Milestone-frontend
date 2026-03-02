import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import { useChatContext } from '../../context/ChatContext';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const statusColors = {
  Resolved: 'bg-green-100 text-green-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  'Under Review': 'bg-blue-100 text-blue-700',
};

const priorityColors = {
  High: 'bg-red-100 text-red-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-gray-100 text-gray-600',
};

const ModeratorDetail = () => {
  const { moderatorId } = useParams();
  const navigate = useNavigate();
  const { openChatWith } = useChatContext();

  const [moderator, setModerator] = useState(null);
  const [activity, setActivity] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [moderatorId]);

  const fetchData = async () => {
    try {
      const [modsRes, actRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/moderators`, { credentials: 'include' }),
        fetch(`${API_BASE}/api/admin/moderators/${moderatorId}/activity`, { credentials: 'include' }),
      ]);

      if (modsRes.ok) {
        const modsData = await modsRes.json();
        const found = modsData.moderators?.find((m) => m.moderatorId === moderatorId);
        if (found) setModerator(found);
      }

      if (actRes.ok) {
        const actData = await actRes.json();
        if (actData.success) {
          setActivity(actData.data.activity);
          setComplaints(actData.data.recentComplaints || []);
        }
      }
    } catch (error) {
      console.error('Error fetching moderator detail:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardPage title="Moderator Details">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading moderator details...</p>
        </div>
      </DashboardPage>
    );
  }

  if (!moderator) {
    return (
      <DashboardPage title="Moderator Details">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-700 mb-1">Moderator not found</p>
          <p className="text-gray-500 mb-4">The moderator you are looking for does not exist.</p>
          <button
            onClick={() => navigate('/admin/moderators')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Moderators
          </button>
        </div>
      </DashboardPage>
    );
  }

  const totalComplaintsHandled = activity
    ? activity.complaintsResolved + activity.complaintsPending + activity.complaintsUnderReview
    : 0;

  return (
    <DashboardPage title="Moderator Details">
      <p className="text-gray-500 -mt-6 mb-6">View detailed information and activity</p>

      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/moderators')}
        className="mb-6 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
      >
        <i className="fas fa-arrow-left text-xs"></i>
        Back to Moderators
      </button>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <img
            src={moderator.picture || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'}
            alt={moderator.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
            onError={(e) => { e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'; }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-gray-900">{moderator.name}</h2>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Moderator</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{moderator.email}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {moderator.phone && moderator.phone !== 'N/A' && (
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-phone text-gray-400 text-xs"></i>{moderator.phone}
                </span>
              )}
              {moderator.location && moderator.location !== 'N/A' && (
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-map-marker-alt text-gray-400 text-xs"></i>{moderator.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <i className="fas fa-calendar text-gray-400 text-xs"></i>
                Joined {moderator.joinedDate ? new Date(moderator.joinedDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            {moderator.aboutMe && (
              <p className="mt-3 text-sm text-gray-500">{moderator.aboutMe}</p>
            )}
          </div>
          <button
            onClick={() => openChatWith(moderator.userId)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            Chat
          </button>
        </div>
      </div>

      {/* Activity Stats */}
      {activity && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Resolved</p>
            <p className="text-2xl font-bold text-green-600">{activity.complaintsResolved}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{activity.complaintsPending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Under Review</p>
            <p className="text-2xl font-bold text-blue-600">{activity.complaintsUnderReview}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Blogs</p>
            <p className="text-2xl font-bold text-purple-600">{activity.totalBlogs}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Quizzes</p>
            <p className="text-2xl font-bold text-indigo-600">{activity.totalQuizzes}</p>
          </div>
        </div>
      )}

      {/* Complaint Resolution Breakdown */}
      {activity && totalComplaintsHandled > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Complaint Resolution Breakdown</h3>
          <div className="space-y-3">
            {[
              { label: 'Resolved', value: activity.complaintsResolved, color: 'bg-green-500' },
              { label: 'Pending', value: activity.complaintsPending, color: 'bg-yellow-500' },
              { label: 'Under Review', value: activity.complaintsUnderReview, color: 'bg-blue-500' },
            ].map((bar, i) => {
              const pct = ((bar.value / totalComplaintsHandled) * 100).toFixed(0);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700">{bar.label}</span>
                    <span className="text-sm text-gray-500">{bar.value} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${bar.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Complaints Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Recent Complaints</h3>
          <p className="text-sm text-gray-500 mt-1">Latest 10 platform complaints</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Raised By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Against</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {complaints.length > 0 ? (
                complaints.map((c, i) => {
                  const againstName = c.complainantType === 'Freelancer' ? c.employerName : c.freelancerName;
                  const againstRole = c.complainantType === 'Freelancer' ? 'Employer' : 'Freelancer';
                  return (
                    <tr key={c.complaintId || i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{c.subject || '—'}</div>
                        {c.jobTitle && (
                          <div className="text-xs text-gray-400 mt-0.5">Job: {c.jobTitle}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{c.complainantName || '—'}</div>
                        {c.complainantType && (
                          <span className="text-xs text-blue-600 font-medium">{c.complainantType}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{againstName || '—'}</div>
                        {againstRole && (
                          <span className="text-xs text-purple-600 font-medium">{againstRole}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.complaintType || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[c.status] || 'bg-gray-100 text-gray-600'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${priorityColors[c.priority] || 'bg-gray-100 text-gray-600'}`}>
                          {c.priority || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-gray-400">
                    No complaints recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {complaints.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            Showing {complaints.length} recent complaints
          </div>
        )}
      </div>
    </DashboardPage>
  );
};

export default ModeratorDetail;

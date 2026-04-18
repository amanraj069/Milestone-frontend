import React, { useState, useEffect } from 'react';
import DashboardPage from '../../components/DashboardPage';
import { getBackendBaseUrl } from '../../utils/backendBaseUrl';

const API_BASE = getBackendBaseUrl();

const AdminStatistics = () => {
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, overviewRes, activitiesRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/statistics`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/admin/dashboard/overview`, { credentials: 'include' }),
          fetch(`${API_BASE}/api/admin/dashboard/activities`, { credentials: 'include' }),
        ]);
        if (statsRes.ok) {
          const data = await statsRes.json();
          if (data.success) setStats(data.data);
        }
        if (overviewRes.ok) {
          const data = await overviewRes.json();
          if (data.success) setOverview(data.data);
        }
        if (activitiesRes.ok) {
          const data = await activitiesRes.json();
          if (data.success) setActivities(data.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const formatCurrency = (val) => `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <DashboardPage title="Platform Statistics">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading statistics...</p>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="Platform Statistics">
      {/* Platform Overview - Key Counts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-blue-100">Total Users</p>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-users text-lg"></i>
            </div>
          </div>
          <p className="text-3xl font-bold">{overview?.users?.total || 0}</p>
          <p className="text-xs text-blue-100 mt-1">
            {overview?.users?.freelancers || 0} Freelancers · {overview?.users?.employers || 0} Employers
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-purple-100">Active Jobs</p>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-briefcase text-lg"></i>
            </div>
          </div>
          <p className="text-3xl font-bold">{overview?.jobs?.active || 0}</p>
          <p className="text-xs text-purple-100 mt-1">{overview?.jobs?.total || 0} total · {overview?.jobs?.completed || 0} completed</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-orange-100">Premium Users</p>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-crown text-lg"></i>
            </div>
          </div>
          <p className="text-3xl font-bold">{overview?.users?.premium || 0}</p>
          <p className="text-xs text-orange-100 mt-1">
            {overview?.users?.total ? ((overview.users.premium / overview.users.total) * 100).toFixed(0) : 0}% of users
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-emerald-100">Total Budget</p>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-wallet text-lg"></i>
            </div>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(overview?.revenue?.totalBudget || 0)}</p>
          <p className="text-xs text-emerald-100 mt-1">{overview?.revenue?.paidMilestones || 0} milestones paid</p>
        </div>
      </div>

      {/* Secondary Platform Counts */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Moderators</p>
          <p className="text-2xl font-bold text-gray-900">{overview?.users?.moderators || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Applications</p>
          <p className="text-2xl font-bold text-gray-900">{overview?.applications?.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Complaints</p>
          <p className="text-2xl font-bold text-gray-900">{overview?.complaints?.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Quizzes</p>
          <p className="text-2xl font-bold text-gray-900">{overview?.quizzes?.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Blogs</p>
          <p className="text-2xl font-bold text-gray-900">{overview?.blogs?.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Avg Rating</p>
          <p className="text-2xl font-bold text-gray-900">{overview?.feedback?.avgRating || 0}<span className="text-sm text-gray-400">/5</span></p>
        </div>
      </div>

      {/* User Distribution, Job Stats, Applications & Complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* User Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">User Distribution</h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'Freelancers', count: overview?.users?.freelancers || 0, color: 'bg-blue-500', total: overview?.users?.total || 1 },
              { label: 'Employers', count: overview?.users?.employers || 0, color: 'bg-emerald-500', total: overview?.users?.total || 1 },
              { label: 'Moderators', count: overview?.users?.moderators || 0, color: 'bg-purple-500', total: overview?.users?.total || 1 },
              { label: 'Admins', count: overview?.users?.admins || 0, color: 'bg-orange-500', total: overview?.users?.total || 1 },
            ].map(({ label, count, color, total }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.max((count / total) * 100, 2)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Job Statistics</h3>
          </div>
          <div className="p-6 space-y-3">
            {[
              { label: 'Active/Open', count: overview?.jobs?.active || 0, color: 'text-green-600', bg: 'bg-green-50', icon: 'fas fa-play-circle' },
              { label: 'Completed', count: overview?.jobs?.completed || 0, color: 'text-blue-600', bg: 'bg-blue-50', icon: 'fas fa-check-circle' },
              { label: 'Closed', count: overview?.jobs?.closed || 0, color: 'text-gray-600', bg: 'bg-gray-50', icon: 'fas fa-times-circle' },
              { label: 'Total Budget', count: formatCurrency(overview?.revenue?.totalBudget || 0), color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'fas fa-wallet' },
            ].map(({ label, count, color, bg, icon }) => (
              <div key={label} className={`flex items-center gap-4 p-3 ${bg} rounded-lg`}>
                <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}>
                  <i className={`${icon} ${color}`}></i>
                </div>
                <div className="flex-1"><p className="text-sm text-gray-600">{label}</p></div>
                <p className={`text-lg font-bold ${color}`}>{count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Applications & Complaints */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Applications & Complaints</h3>
          </div>
          <div className="p-6 space-y-3">
            <div className="p-3 bg-yellow-50 rounded-lg flex justify-between items-center">
              <span className="text-sm text-gray-600"><i className="fas fa-clock text-yellow-500 mr-2"></i>Pending Apps</span>
              <span className="font-bold text-yellow-600">{overview?.applications?.pending || 0}</span>
            </div>
            <div className="p-3 bg-green-50 rounded-lg flex justify-between items-center">
              <span className="text-sm text-gray-600"><i className="fas fa-check text-green-500 mr-2"></i>Accepted Apps</span>
              <span className="font-bold text-green-600">{overview?.applications?.accepted || 0}</span>
            </div>
            <div className="p-3 bg-red-50 rounded-lg flex justify-between items-center">
              <span className="text-sm text-gray-600"><i className="fas fa-times text-red-500 mr-2"></i>Rejected Apps</span>
              <span className="font-bold text-red-600">{overview?.applications?.rejected || 0}</span>
            </div>
            <hr className="my-2" />
            <div className="p-3 bg-orange-50 rounded-lg flex justify-between items-center">
              <span className="text-sm text-gray-600"><i className="fas fa-exclamation-triangle text-orange-500 mr-2"></i>Pending Complaints</span>
              <span className="font-bold text-orange-600">{overview?.complaints?.pending || 0}</span>
            </div>
            <div className="p-3 bg-green-50 rounded-lg flex justify-between items-center">
              <span className="text-sm text-gray-600"><i className="fas fa-check-double text-green-500 mr-2"></i>Resolved Complaints</span>
              <span className="font-bold text-green-600">{overview?.complaints?.resolved || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
          <p className="text-sm text-blue-100">New Signups (30d)</p>
          <p className="text-3xl font-bold mt-1">{stats?.recentSignups || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-5 text-white">
          <p className="text-sm text-emerald-100">New Jobs (30d)</p>
          <p className="text-3xl font-bold mt-1">{stats?.newJobsThisMonth || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
          <p className="text-sm text-purple-100">Top Freelancers</p>
          <p className="text-3xl font-bold mt-1">{stats?.topFreelancers?.length || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-5 text-white">
          <p className="text-sm text-orange-100">Top Employers</p>
          <p className="text-3xl font-bold mt-1">{stats?.topEmployers?.length || 0}</p>
        </div>
      </div>

      {/* User Growth & Jobs Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">User Growth by Month</h3>
          </div>
          <div className="p-6">
            {stats?.userGrowth?.length > 0 ? (
              <div className="space-y-3">
                {stats.userGrowth.map((item, i) => {
                  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                  const maxCount = Math.max(...stats.userGrowth.map(u => u.count));
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{months[(item._id.month - 1)]} {item._id.year}</span>
                        <span className="font-medium text-gray-900">{item.count} users</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className="bg-blue-500 h-2.5 rounded-full transition-all"
                          style={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No growth data</p>
            )}
          </div>
        </div>

        {/* Jobs by Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Jobs by Status</h3>
          </div>
          <div className="p-6">
            {stats?.jobsByStatus?.length > 0 ? (
              <div className="space-y-3">
                {stats.jobsByStatus.map((item, i) => {
                  const colors = {
                    open: 'bg-blue-500', active: 'bg-green-500', 'in-progress': 'bg-yellow-500',
                    completed: 'bg-emerald-500', closed: 'bg-gray-400',
                  };
                  const total = stats.jobsByStatus.reduce((s, j) => s + j.count, 0);
                  return (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${colors[item._id] || 'bg-gray-300'}`}></div>
                      <span className="flex-1 text-sm text-gray-700 capitalize">{item._id || 'Unknown'}</span>
                      <span className="font-bold text-gray-900">{item.count}</span>
                      <span className="text-xs text-gray-400">{total > 0 ? ((item.count / total) * 100).toFixed(0) : 0}%</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No jobs data</p>
            )}
          </div>
        </div>
      </div>

      {/* Job Type & Budget Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Jobs by Type */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Jobs by Type</h3>
          </div>
          <div className="p-6">
            {stats?.jobsByType?.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {stats.jobsByType.map((item, i) => {
                  const colors = ['bg-blue-50 text-blue-700 border-blue-200', 'bg-green-50 text-green-700 border-green-200', 'bg-purple-50 text-purple-700 border-purple-200', 'bg-orange-50 text-orange-700 border-orange-200'];
                  return (
                    <div key={i} className={`p-4 rounded-lg border ${colors[i % colors.length]} text-center`}>
                      <p className="text-2xl font-bold">{item.count}</p>
                      <p className="text-sm capitalize mt-1">{item._id || 'Unknown'}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No data</p>
            )}
          </div>
        </div>

        {/* Budget Analysis */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Average Budget by Job Type</h3>
          </div>
          <div className="p-6">
            {stats?.avgBudgetByType?.length > 0 ? (
              <div className="space-y-4">
                {stats.avgBudgetByType.map((item, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">{item._id || 'Unknown'}</span>
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(item.avgBudget)} avg</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Min: {formatCurrency(item.minBudget)}</span>
                      <span>Max: {formatCurrency(item.maxBudget)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No budget data</p>
            )}
          </div>
        </div>
      </div>

      {/* Complaints Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* By Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Complaints by Status</h3>
          </div>
          <div className="p-6 space-y-3">
            {stats?.complaintsByStatus?.map((item, i) => {
              const colors = { Pending: 'text-yellow-600 bg-yellow-50', 'Under Review': 'text-blue-600 bg-blue-50', Resolved: 'text-green-600 bg-green-50', Rejected: 'text-red-600 bg-red-50' };
              const c = colors[item._id] || 'text-gray-600 bg-gray-50';
              return (
                <div key={i} className={`flex justify-between items-center p-3 rounded-lg ${c.split(' ')[1]}`}>
                  <span className={`text-sm font-medium ${c.split(' ')[0]}`}>{item._id || 'Unknown'}</span>
                  <span className={`text-xl font-bold ${c.split(' ')[0]}`}>{item.count}</span>
                </div>
              );
            }) || <p className="text-gray-400 text-center">No data</p>}
          </div>
        </div>

        {/* By Type */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Complaints by Type</h3>
          </div>
          <div className="p-6 space-y-2">
            {stats?.complaintsByType?.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                <span className="text-sm text-gray-600">{item._id || 'Unknown'}</span>
                <span className="text-sm font-bold text-gray-900">{item.count}</span>
              </div>
            )) || <p className="text-gray-400 text-center">No data</p>}
          </div>
        </div>

        {/* By Priority */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Complaints by Priority</h3>
          </div>
          <div className="p-6 space-y-3">
            {stats?.complaintsByPriority?.map((item, i) => {
              const colors = { High: 'bg-red-500', Medium: 'bg-yellow-500', Low: 'bg-green-500' };
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${colors[item._id] || 'bg-gray-300'}`}></div>
                  <span className="flex-1 text-sm text-gray-600">{item._id || 'Unknown'}</span>
                  <span className="text-lg font-bold text-gray-900">{item.count}</span>
                </div>
              );
            }) || <p className="text-gray-400 text-center">No data</p>}
          </div>
        </div>
      </div>

      {/* Subscription Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Subscription Distribution by Role</h3>
        </div>
        <div className="p-6">
          {stats?.subscriptionDist?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.subscriptionDist.map((item, i) => (
                <div key={i} className={`p-4 rounded-lg border text-center ${
                  item._id.subscription === 'Premium' ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <p className="text-2xl font-bold text-gray-900">{item.count}</p>
                  <p className="text-sm text-gray-600 mt-1">{item._id.role}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    item._id.subscription === 'Premium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item._id.subscription === 'Premium' && <i className="fas fa-crown mr-1 text-[10px]"></i>}
                    {item._id.subscription}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No subscription data</p>
          )}
        </div>
      </div>

      {/* Top Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Freelancers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Top Rated Freelancers</h3>
          </div>
          <div className="p-6 space-y-3">
            {stats?.topFreelancers?.map((user, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                  <img
                    src={user.picture || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-yellow-500 text-sm"><i className="fas fa-star mr-1"></i>{user.rating?.toFixed(1)}</span>
                  {user.subscription === 'Premium' && (
                    <p className="text-xs text-yellow-600"><i className="fas fa-crown mr-1"></i>Premium</p>
                  )}
                </div>
              </div>
            )) || <p className="text-gray-400 text-center py-8">No data</p>}
          </div>
        </div>

        {/* Top Employers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Top Rated Employers</h3>
          </div>
          <div className="p-6 space-y-3">
            {stats?.topEmployers?.map((user, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-600 text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                  <img
                    src={user.picture || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'}
                    alt={user.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'; }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className="text-yellow-500 text-sm"><i className="fas fa-star mr-1"></i>{user.rating?.toFixed(1)}</span>
                  {user.subscription === 'Premium' && (
                    <p className="text-xs text-yellow-600"><i className="fas fa-crown mr-1"></i>Premium</p>
                  )}
                </div>
              </div>
            )) || <p className="text-gray-400 text-center py-8">No data</p>}
          </div>
        </div>
      </div>

      {/* Applications by Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Application Statistics</h3>
        </div>
        <div className="p-6">
          {stats?.applicationsByStatus?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.applicationsByStatus.map((item, i) => {
                const config = {
                  Pending: { icon: 'fas fa-clock', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
                  Accepted: { icon: 'fas fa-check-circle', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
                  Rejected: { icon: 'fas fa-times-circle', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
                };
                const c = config[item._id] || { icon: 'fas fa-file', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' };
                return (
                  <div key={i} className={`p-5 rounded-lg border ${c.border} ${c.bg} text-center`}>
                    <i className={`${c.icon} text-3xl mb-2 ${c.color}`}></i>
                    <p className={`text-3xl font-bold ${c.color}`}>{item.count}</p>
                    <p className="text-sm text-gray-600 mt-1">{item._id || 'Unknown'}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No application data</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity, index) => {
                const iconMap = {
                  user: 'fas fa-user-plus text-blue-500',
                  complaint: 'fas fa-gavel text-orange-500',
                  job: 'fas fa-briefcase text-purple-500',
                  application: 'fas fa-file-alt text-green-500',
                };
                return (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <i className={iconMap[activity.icon] || 'fas fa-info-circle text-gray-400'}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No recent activities</p>
          )}
        </div>
      </div>
    </DashboardPage>
  );
};

export default AdminStatistics;

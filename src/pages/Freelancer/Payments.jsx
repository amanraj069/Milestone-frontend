import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import ColumnToggle, { useColumnToggle } from '../../components/ColumnToggle';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const ACTIVE_COLUMNS = [
  { key: 'employer', label: 'Employer' },
  { key: 'job', label: 'Job Details' },
  { key: 'status', label: 'Status' },
  { key: 'progress', label: 'Payment Progress' },
  { key: 'budget', label: 'Budget' },
  { key: 'milestones', label: 'Milestones', defaultVisible: false },
  { key: 'action', label: 'Action' },
];

const COMPLETED_COLUMNS = [
  { key: 'employer', label: 'Employer' },
  { key: 'job', label: 'Job Details' },
  { key: 'status', label: 'Status', defaultVisible: false },
  { key: 'earned', label: 'Total Earned' },
  { key: 'action', label: 'Action' },
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getAvailableYears(payments) {
  const years = new Set();
  payments.forEach((p) => {
    const d = p.startDate ? new Date(p.startDate) : new Date();
    years.add(d.getFullYear());
  });
  const now = new Date();
  years.add(now.getFullYear());
  return [...years].sort((a, b) => b - a);
}

// Helper: get real pending for a payment (left jobs only count requested milestones)
function getRealPending(p) {
  if (p.status === 'left') return p.requestedAmount || 0;
  return (p.totalBudget || 0) - (p.paidAmount || 0);
}

function buildMonthlyEarnings(payments, year) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const maxMonth = year === currentYear ? currentMonth : 11;

  // Initialize all months for the selected year
  const map = {};
  for (let m = 0; m <= maxMonth; m++) {
    const key = `${year}-${String(m + 1).padStart(2, '0')}`;
    map[key] = { month: key, earned: 0, pending: 0, label: MONTH_SHORT[m] };
  }

  // Aggregate payment data for matching year
  payments.forEach((p) => {
    const d = p.startDate ? new Date(p.startDate) : new Date();
    if (d.getFullYear() !== year) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (map[key]) {
      map[key].earned += p.paidAmount || 0;
      map[key].pending += getRealPending(p);
    }
  });

  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-gray-700">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: ₹{p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const FreelancerPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('bar'); // bar | area
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const navigate = useNavigate();

  const activeCols = useColumnToggle(ACTIVE_COLUMNS, 'payments-active-cols');
  const completedCols = useColumnToggle(COMPLETED_COLUMNS, 'payments-completed-cols');

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/freelancer/payments`, { credentials: 'include' });
      const data = await response.json();
      if (data.success) { setPayments(data.data); }
      else { setError(data.error || 'Failed to fetch payments'); }
    } catch (err) {
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (jobId) => navigate(`/freelancer/payments/${jobId}`);

  const getStatusBadge = (status) => {
    const config = {
      working: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'In Progress' },
      finished: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Completed' },
      left: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Left' },
    };
    const { bg, text, dot, label } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500', label: status };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bg} ${text}`}>
        <span className={`w-2 h-2 rounded-full ${dot} mr-2`}></span>{label}
      </span>
    );
  };

  const totalEarnings = payments.reduce((s, p) => s + p.paidAmount, 0);
  const pendingPayments = payments.reduce((s, p) => s + getRealPending(p), 0);
  const activeProjects = payments.filter((p) => p.status === 'working').length;
  const completedProjects = payments.filter((p) => p.status === 'finished' || p.status === 'left').length;

  const availableYears = useMemo(() => getAvailableYears(payments), [payments]);
  const monthlyData = useMemo(() => buildMonthlyEarnings(payments, selectedYear), [payments, selectedYear]);

  if (loading) {
    return (
      <DashboardPage title="Payments">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading payments...</p>
          </div>
        </div>
      </DashboardPage>
    );
  }

  if (error) {
    return (
      <DashboardPage title="Payments">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Payments</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button onClick={fetchPayments} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Try Again
            </button>
          </div>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="Payments">
      <p className="text-gray-500 mb-8 -mt-4">Track your earnings and manage milestone payments</p>

      {/*   Stat Cards      */}
      {payments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Earned */}
          <div className="rounded-xl p-5 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100">Total Earned</p>
                <p className="text-2xl font-bold mt-1">₹{totalEarnings.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </div>
          {/* Pending */}
          <div className="rounded-xl p-5 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-100">Pending Payments</p>
                <p className="text-2xl font-bold mt-1">₹{pendingPayments.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </div>
          {/* Active */}
          <div className="rounded-xl p-5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Active Projects</p>
                <p className="text-2xl font-bold mt-1">{activeProjects}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
            </div>
          </div>
          {/* Completed */}
          <div className="rounded-xl p-5 bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-100">Completed</p>
                <p className="text-2xl font-bold mt-1">{completedProjects}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*   Earnings Chart     */}
      {payments.length > 0 && monthlyData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Earnings Overview</h2>
              <p className="text-sm text-gray-500">Monthly breakdown of your earnings and pending amounts</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${chartType === 'bar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Bar
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${chartType === 'area' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Area
                </button>
              </div>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="earned" name="Earned" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={monthlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="earnedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="pendingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="earned" name="Earned" stroke="#10b981" fillOpacity={1} fill="url(#earnedGrad)" />
                  <Area type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" fillOpacity={1} fill="url(#pendingGrad)" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-gray-600">Earned</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-xs text-gray-600">Pending</span>
            </div>
          </div>
        </div>
      )}

      {/*   Active Projects Table    */}
      {payments.filter((p) => p.status === 'working').length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Active Projects</h2>
            <ColumnToggle columns={ACTIVE_COLUMNS} visible={activeCols.visible} onChange={activeCols.setVisible} storageKey="payments-active-cols" />
          </div>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
                    {activeCols.visible.has('employer') && <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Employer</th>}
                    {activeCols.visible.has('job') && <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Job Details</th>}
                    {activeCols.visible.has('status') && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>}
                    {activeCols.visible.has('progress') && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Payment Progress</th>}
                    {activeCols.visible.has('budget') && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Budget</th>}
                    {activeCols.visible.has('milestones') && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Milestones</th>}
                    {activeCols.visible.has('action') && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.filter((p) => p.status === 'working').map((payment) => (
                    <tr key={payment.jobId} className="hover:bg-gray-50 transition-colors">
                      {activeCols.visible.has('employer') && (
                        <td className="px-6 py-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {payment.employerPicture ? (
                                <img className="h-10 w-10 rounded-full object-cover border-2 border-white shadow" src={payment.employerPicture} alt={payment.employerName} />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold shadow">
                                  {payment.employerName?.charAt(0)?.toUpperCase() || 'E'}
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-semibold text-gray-900">{payment.employerName}</div>
                              <div className="text-xs text-gray-500">{payment.companyName || 'Company'}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      {activeCols.visible.has('job') && (
                        <td className="px-6 py-5">
                          <div className="text-sm font-semibold text-gray-900 mb-1">{payment.jobTitle}</div>
                          <div className="flex items-center text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            {payment.completedMilestones}/{payment.milestonesCount} milestones
                          </div>
                        </td>
                      )}
                      {activeCols.visible.has('status') && <td className="px-6 py-5 text-center">{getStatusBadge(payment.status)}</td>}
                      {activeCols.visible.has('progress') && (
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-center">
                            <div className="w-full max-w-[120px] bg-gray-100 rounded-full h-2.5 mb-2">
                              <div className={`h-2.5 rounded-full transition-all duration-500 ${payment.paymentPercentage === 100 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} style={{ width: `${payment.paymentPercentage}%` }}></div>
                            </div>
                            <span className="text-sm font-semibold text-gray-700">{payment.paymentPercentage}%</span>
                          </div>
                        </td>
                      )}
                      {activeCols.visible.has('budget') && (
                        <td className="px-6 py-5 text-center">
                          <div className="text-sm font-bold text-gray-900">₹{payment.totalBudget.toLocaleString()}</div>
                          <div className="text-xs text-green-600 font-medium">₹{payment.paidAmount.toLocaleString()} received</div>
                        </td>
                      )}
                      {activeCols.visible.has('milestones') && (
                        <td className="px-6 py-5 text-center">
                          <span className="text-sm font-semibold text-gray-700">{payment.completedMilestones}/{payment.milestonesCount}</span>
                        </td>
                      )}
                      {activeCols.visible.has('action') && (
                        <td className="px-6 py-5 text-center">
                          <button onClick={() => handleViewDetails(payment.jobId)} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            View Details
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/*   Completed / Left Projects Table      */}
      {payments.filter((p) => p.status === 'finished' || p.status === 'left').length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Past Projects</h2>
            <ColumnToggle columns={COMPLETED_COLUMNS} visible={completedCols.visible} onChange={completedCols.setVisible} storageKey="payments-completed-cols" />
          </div>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-green-50 border-b border-gray-100">
                    {completedCols.visible.has('employer') && <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Employer</th>}
                    {completedCols.visible.has('job') && <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Job Details</th>}
                    {completedCols.visible.has('status') && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>}
                    {completedCols.visible.has('earned') && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Total Earned</th>}
                    {completedCols.visible.has('action') && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.filter((p) => p.status === 'finished' || p.status === 'left').map((payment) => (
                    <tr key={payment.jobId} className="hover:bg-gray-50 transition-colors">
                      {completedCols.visible.has('employer') && (
                        <td className="px-6 py-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {payment.employerPicture ? (
                                <img className="h-10 w-10 rounded-full object-cover border-2 border-white shadow" src={payment.employerPicture} alt={payment.employerName} />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold shadow">
                                  {payment.employerName?.charAt(0)?.toUpperCase() || 'E'}
                                </div>
                              )}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-semibold text-gray-900">{payment.employerName}</div>
                              <div className="text-xs text-gray-500">{payment.companyName || 'Company'}</div>
                            </div>
                          </div>
                        </td>
                      )}
                      {completedCols.visible.has('job') && (
                        <td className="px-6 py-5">
                          <div className="text-sm font-semibold text-gray-900 mb-1">{payment.jobTitle}</div>
                          <div className="flex items-center text-xs text-gray-500">
                            <svg className="w-3.5 h-3.5 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {payment.milestonesCount} milestones completed
                          </div>
                        </td>
                      )}
                      {completedCols.visible.has('status') && <td className="px-6 py-5 text-center">{getStatusBadge(payment.status)}</td>}
                      {completedCols.visible.has('earned') && (
                        <td className="px-6 py-5 text-center">
                          <div className="text-lg font-bold text-green-600">₹{payment.paidAmount.toLocaleString()}</div>
                        </td>
                      )}
                      {completedCols.visible.has('action') && (
                        <td className="px-6 py-5 text-center">
                          <button onClick={() => handleViewDetails(payment.jobId)} className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-semibold rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg">
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            View Details
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/*   No Payments       */}
      {payments.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payments Yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">Once you start working on jobs, your payment details will appear here.</p>
          </div>
        </div>
      )}

    </DashboardPage>
  );
};

export default FreelancerPayments;


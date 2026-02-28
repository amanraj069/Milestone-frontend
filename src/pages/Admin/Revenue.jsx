import React, { useState, useEffect } from 'react';
import DashboardPage from '../../components/DashboardPage';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

/* ───────────────── Detail Modal ───────────────── */
const DetailModal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
          <i className="fas fa-times text-gray-400"></i>
        </button>
      </div>
      <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
        {children}
      </div>
    </div>
  </div>
);

/* ───────────────── Monthly Revenue Chart ───────────────── */
const RevenueChart = ({ data, onBarClick }) => {
  if (!data || data.length === 0) return null;
  
  const maxRevenue = Math.max(...data.map(m => m.totalRevenue), 1);
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
      <div className="flex items-end justify-between gap-2 h-48">
        {data.map((month, idx) => {
          const height = (month.totalRevenue / maxRevenue) * 100;
          const subHeight = (month.subscriptionRevenue / maxRevenue) * 100;
          const feeHeight = (month.platformFeeRevenue / maxRevenue) * 100;
          
          return (
            <div 
              key={month.label} 
              className="flex-1 flex flex-col items-center cursor-pointer group"
              onClick={() => onBarClick(month)}
            >
              <div className="w-full flex flex-col items-center relative h-40">
                {/* Tooltip on hover */}
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                  ₹{month.totalRevenue.toLocaleString('en-IN')}
                </div>
                {/* Stacked bar */}
                <div 
                  className="w-full max-w-8 rounded-t-md overflow-hidden transition-all group-hover:scale-105"
                  style={{ height: `${height}%` }}
                >
                  <div 
                    className="w-full bg-blue-500" 
                    style={{ height: `${subHeight > 0 ? (subHeight / height) * 100 : 0}%` }}
                  ></div>
                  <div 
                    className="w-full bg-emerald-500" 
                    style={{ height: `${feeHeight > 0 ? (feeHeight / height) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">{month.label}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span className="text-xs text-gray-600">Subscriptions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-500"></div>
          <span className="text-xs text-gray-600">Platform Fees</span>
        </div>
      </div>
    </div>
  );
};

/* ───────────────── Main Component ───────────────── */
const AdminRevenue = () => {
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showFeeStructure, setShowFeeStructure] = useState(false);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/dashboard/revenue`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setRevenue(data.data);
        }
      } catch (error) {
        console.error('Error fetching revenue:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  const formatCurrency = (val) => `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  if (loading) {
    return (
      <DashboardPage title="Revenue Analytics">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading revenue data...</p>
        </div>
      </DashboardPage>
    );
  }

  const totals = revenue?.totals || {};
  const engagement = revenue?.engagement || {};
  const monthlyData = revenue?.monthlyRevenue || [];
  const recentFees = revenue?.recentPlatformFees || [];
  const feeStructure = revenue?.feeStructure || {};

  return (
    <DashboardPage title="Revenue Analytics">
      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-emerald-100">Total Revenue</p>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-rupee-sign text-lg"></i>
            </div>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totals.totalRevenue)}</p>
          <p className="text-xs text-emerald-100 mt-1">All time earnings</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-blue-100">Subscription Revenue</p>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-crown text-lg"></i>
            </div>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totals.subscriptionRevenue)}</p>
          <p className="text-xs text-blue-100 mt-1">{engagement.premiumUsers || 0} premium users</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-purple-100">Platform Fees</p>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-percentage text-lg"></i>
            </div>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totals.platformFees)}</p>
          <p className="text-xs text-purple-100 mt-1">From job listings</p>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-orange-100">This Month</p>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <i className="fas fa-calendar text-lg"></i>
            </div>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(totals.thisMonthRevenue)}</p>
          <div className="flex items-center gap-1 mt-1">
            {totals.revenueGrowth >= 0 ? (
              <i className="fas fa-arrow-up text-xs"></i>
            ) : (
              <i className="fas fa-arrow-down text-xs"></i>
            )}
            <span className="text-xs text-orange-100">{Math.abs(totals.revenueGrowth || 0)}% vs last month</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="mb-8">
        <RevenueChart data={monthlyData} onBarClick={setSelectedMonth} />
      </div>

      {/* Engagement Stats & Fee Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Platform Engagement */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Platform Engagement</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase mb-1">Job Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{engagement.jobCompletionRate || 0}%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase mb-1">Hire Rate</p>
              <p className="text-2xl font-bold text-gray-900">{engagement.hireRate || 0}%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase mb-1">Premium Conversion</p>
              <p className="text-2xl font-bold text-gray-900">{engagement.conversionRate || 0}%</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase mb-1">Active Users (30d)</p>
              <p className="text-2xl font-bold text-gray-900">{engagement.activeUsers || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase mb-1">Recent Jobs (30d)</p>
              <p className="text-2xl font-bold text-gray-900">{engagement.recentJobs || 0}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 uppercase mb-1">Avg Jobs/Month</p>
              <p className="text-2xl font-bold text-gray-900">{engagement.avgJobsPerMonth || 0}</p>
            </div>
          </div>
        </div>

        {/* Fee Structure */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Platform Fee Structure</h3>
            <button
              onClick={() => setShowFeeStructure(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Details
            </button>
          </div>
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold">{feeStructure.baseRate || 5}%</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Base Rate</p>
                <p className="text-xs text-gray-500">Applied to all job listings</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">{feeStructure.description || 'Platform fee varies based on listing duration and applicant volume.'}</p>
        </div>
      </div>

      {/* Recent Platform Fees */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Recent Platform Fee Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Job</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Budget</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Applicants</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fee Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fee Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentFees.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No platform fee transactions found
                  </td>
                </tr>
              ) : (
                recentFees.map((fee, idx) => (
                  <tr key={fee.jobId || idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{fee.title}</p>
                      <p className="text-xs text-gray-500">ID: {fee.jobId}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{fee.employerName}</p>
                      <p className="text-xs text-gray-500">{fee.companyName}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(fee.budget)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fee.durationDays} days</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fee.applicantCount}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {fee.feeRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{formatCurrency(fee.feeAmount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {fee.postedDate ? new Date(fee.postedDate).toLocaleDateString('en-IN', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric' 
                      }) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Month Detail Modal */}
      {selectedMonth && (
        <DetailModal title={`Revenue Details - ${selectedMonth.label}`} onClose={() => setSelectedMonth(null)}>
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-lg text-center">
                <p className="text-xs text-emerald-600 uppercase font-medium mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(selectedMonth.totalRevenue)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-blue-600 uppercase font-medium mb-1">Subscriptions</p>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(selectedMonth.subscriptionRevenue)}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-xs text-purple-600 uppercase font-medium mb-1">Platform Fees</p>
                <p className="text-xl font-bold text-purple-700">{formatCurrency(selectedMonth.platformFeeRevenue)}</p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Jobs Posted This Month</span>
                <span className="text-lg font-bold text-gray-900">{selectedMonth.jobsPosted}</span>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Revenue Breakdown</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ 
                        width: `${selectedMonth.totalRevenue > 0 
                          ? (selectedMonth.subscriptionRevenue / selectedMonth.totalRevenue) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 w-16 text-right">
                    {selectedMonth.totalRevenue > 0 
                      ? Math.round((selectedMonth.subscriptionRevenue / selectedMonth.totalRevenue) * 100) 
                      : 0}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ 
                        width: `${selectedMonth.totalRevenue > 0 
                          ? (selectedMonth.platformFeeRevenue / selectedMonth.totalRevenue) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 w-16 text-right">
                    {selectedMonth.totalRevenue > 0 
                      ? Math.round((selectedMonth.platformFeeRevenue / selectedMonth.totalRevenue) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DetailModal>
      )}

      {/* Fee Structure Modal */}
      {showFeeStructure && feeStructure.tiers && (
        <DetailModal title="Platform Fee Structure" onClose={() => setShowFeeStructure(false)}>
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <p className="text-sm text-gray-700">{feeStructure.description}</p>
            </div>
            
            {/* Duration Tiers */}
            {feeStructure.tiers?.duration && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Duration-based Modifiers</h4>
                <div className="space-y-2">
                  {feeStructure.tiers.duration.map((tier, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {tier.label}
                        </span>
                        <span className="text-sm text-gray-600">{tier.range}</span>
                      </div>
                      <span className={`text-sm font-semibold ${
                        tier.modifier.startsWith('+') ? 'text-red-600' : 
                        tier.modifier.startsWith('-') ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {tier.modifier}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Applicant Tiers */}
            {feeStructure.tiers?.applicants && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Applicant-based Modifiers</h4>
                <div className="space-y-2">
                  {feeStructure.tiers.applicants.map((tier, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                          {tier.label}
                        </span>
                        <span className="text-sm text-gray-600">{tier.range} applicants</span>
                      </div>
                      <span className={`text-sm font-semibold ${
                        tier.modifier.startsWith('+') ? 'text-red-600' : 
                        tier.modifier.startsWith('-') ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {tier.modifier}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DetailModal>
      )}
    </DashboardPage>
  );
};

export default AdminRevenue;

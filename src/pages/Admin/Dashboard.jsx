import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import DashboardPage from '../../components/DashboardPage';
import { graphqlQuery } from '../../utils/graphqlClient';

// ─── Metric Detail Modal ───
const MetricModal = ({ isOpen, onClose, metric }) => {
  if (!isOpen || !metric) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
        <div className={`px-6 py-4 border-b border-gray-100 ${metric.headerBg || 'bg-gradient-to-r from-slate-50 to-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl ${metric.iconBg} flex items-center justify-center shadow-sm`}>
                <i className={`fas ${metric.icon} text-lg ${metric.iconColor}`}></i>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{metric.title}</h3>
                <p className="text-sm text-gray-500">{metric.subtitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-lg hover:bg-black/5 flex items-center justify-center transition-colors">
              <i className="fas fa-times text-gray-400"></i>
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-90px)]">
          {metric.content}
        </div>
      </div>
    </div>
  );
};

// ─── Clickable Metric Card (KPI Ribbon Item) ───
const KPIItem = ({ label, value, icon, accent, badge, onClick, isClickable = true }) => (
  <div
    onClick={isClickable ? onClick : undefined}
    className={`px-4 py-4 text-center group transition-all first:rounded-l-xl last:rounded-r-xl relative ${
      isClickable ? 'hover:bg-white/10 cursor-pointer' : ''
    }`}
  >
    <div className="flex items-center justify-center gap-1.5 mb-1.5">
      <i className={`fas ${icon} text-[10px] ${accent}`}></i>
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
    </div>
    <p className="text-lg font-bold text-white leading-none">{value}</p>
    {badge && (
      <span className={`inline-block mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold ${badge.color}`}>
        {badge.text}
      </span>
    )}
    {isClickable && (
      <i className="fas fa-chevron-right text-[8px] text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></i>
    )}
  </div>
);

const ADMIN_DASHBOARD_REVENUE_QUERY = `
  query AdminDashboardRevenue {
    adminDashboardRevenue {
      monthlyRevenue { label year month subscriptionRevenue platformFeeRevenue totalRevenue jobsPosted }
      totals { totalRevenue subscriptionRevenue platformFees thisMonthRevenue revenueGrowth }
      engagement { jobCompletionRate hireRate activeUsers totalUsers premiumUsers conversionRate recentJobs recentApplications avgJobsPerMonth }
      feeStructure { baseRate description range tiers { platform { range modifier label } applicationCap { range modifier label } } }
    }
  }
`;

const ADMIN_PLATFORM_FEES_QUERY = `
  query AdminPlatformFeeCollections($first: Int!, $after: String) {
    adminPlatformFeeCollections(first: $first, after: $after) {
      edges {
        cursor
        node { jobId title budget durationDays applicantCount feeRate feeAmount postedDate status employerName companyName }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      total
    }
  }
`;

const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recentFees, setRecentFees] = useState([]);
  const [totalFeeCollections, setTotalFeeCollections] = useState(0);
  const [feePagination, setFeePagination] = useState(null);
  const [feePageSize, setFeePageSize] = useState(10);
  const [feePage, setFeePage] = useState(1);
  const [feeAfterCursor, setFeeAfterCursor] = useState(null);
  const [feeCursorStack, setFeeCursorStack] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const result = await graphqlQuery(ADMIN_DASHBOARD_REVENUE_QUERY);
        if (result?.adminDashboardRevenue) setData(result.adminDashboardRevenue);
      } catch (error) {
        console.error('Error fetching dashboard revenue:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  useEffect(() => {
    resetAndFetchPlatformFees();
  }, [feePageSize]);

  const fetchPlatformFees = async ({ after = feeAfterCursor } = {}) => {
    try {
      const result = await graphqlQuery(ADMIN_PLATFORM_FEES_QUERY, {
        first: feePageSize,
        after,
      });

      const connection = result?.adminPlatformFeeCollections;
      const edges = connection?.edges || [];

      setRecentFees(edges.map((edge) => edge.node));
      setTotalFeeCollections(connection?.total || 0);
      setFeePagination({
        hasNextPage: connection?.pageInfo?.hasNextPage || false,
        endCursor: connection?.pageInfo?.endCursor || null,
      });
    } catch (error) {
      console.error('Error fetching platform fee collections:', error);
      setRecentFees([]);
      setTotalFeeCollections(0);
      setFeePagination({ hasNextPage: false, endCursor: null });
    }
  };

  const resetAndFetchPlatformFees = async () => {
    setFeePage(1);
    setFeeAfterCursor(null);
    setFeeCursorStack([]);
    await fetchPlatformFees({ after: null });
  };

  const handleFeeNextPage = async () => {
    if (!feePagination?.hasNextPage || !feePagination?.endCursor) return;
    const nextAfter = feePagination.endCursor;
    setFeeCursorStack((prev) => [...prev, feeAfterCursor]);
    setFeeAfterCursor(nextAfter);
    setFeePage((p) => p + 1);
    await fetchPlatformFees({ after: nextAfter });
  };

  const handleFeePrevPage = async () => {
    if (feePage <= 1) return;
    const nextStack = [...feeCursorStack];
    const prevAfter = nextStack.pop() ?? null;
    setFeeCursorStack(nextStack);
    setFeeAfterCursor(prevAfter);
    setFeePage((p) => Math.max(1, p - 1));
    await fetchPlatformFees({ after: prevAfter });
  };

  const handleFeePageSizeChange = (nextSize) => {
    const normalized = Math.min(100, Math.max(1, Number(nextSize) || 10));
    setFeePageSize(normalized);
  };

  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
    return `₹${(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatFull = (val) => `₹${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ─── Generate all 12 months (even with 0 values) ───
  const getAllMonths = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const months = [];
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      months.push({ month: d.getMonth() + 1, year: d.getFullYear(), label });
    }
    return months;
  }, []);

  // ─── Normalize monthly data to ensure all 12 months present ───
  const normalizedMonthly = useMemo(() => {
    if (!data?.monthlyRevenue) return getAllMonths.map(m => ({ ...m, totalRevenue: 0, subscriptionRevenue: 0, platformFeeRevenue: 0, jobsPosted: 0 }));
    
    return getAllMonths.map(m => {
      const existing = data.monthlyRevenue.find(r => r.month === m.month && r.year === m.year);
      if (existing) return { ...existing, label: m.label };
      return { ...m, totalRevenue: 0, subscriptionRevenue: 0, platformFeeRevenue: 0, jobsPosted: 0 };
    });
  }, [data?.monthlyRevenue, getAllMonths]);

  if (loading) {
    return (
      <DashboardPage title="Admin Dashboard">
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="flex items-end gap-2 h-48">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="flex-1 bg-gray-100 rounded-t" style={{ height: `${20 + Math.random() * 60}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardPage>
    );
  }

  const totals = data?.totals || {};
  const engagement = data?.engagement || {};
  const feeTiers = data?.feeStructure || {};

  // Derived metrics (using normalized data to ensure 12-month consistency)
  const avgMonthlyRevenue = normalizedMonthly.reduce((s, m) => s + m.totalRevenue, 0) / 12;
  const bestMonth = normalizedMonthly.reduce((best, m) => m.totalRevenue > (best?.totalRevenue || 0) ? m : best, normalizedMonthly[0]);
  const revenuePerUser = engagement.activeUsers > 0 ? totals.totalRevenue / engagement.activeUsers : 0;
  const subPct = totals.totalRevenue > 0 ? ((totals.subscriptionRevenue / totals.totalRevenue) * 100) : 50;
  const feePct = totals.totalRevenue > 0 ? ((totals.platformFees / totals.totalRevenue) * 100) : 50;
  const avgFeeRate = recentFees.length > 0 ? (recentFees.reduce((s, f) => s + f.feeRate, 0) / recentFees.length) : 5;

  // Use normalized monthly data for all 12 months
  const maxMonthlyRevenueNorm = Math.max(...normalizedMonthly.map(m => m.totalRevenue), 1);
  
  // Cumulative revenue for sparkline (using normalized data)
  const cumulative = normalizedMonthly.reduce((acc, m) => {
    const last = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(last + m.totalRevenue);
    return acc;
  }, []);
  const maxCum = Math.max(...cumulative, 1);

  // ─── Modal Content Generators ───
  const getModalContent = (type) => {
    switch (type) {
      case 'totalRevenue':
        return {
          title: 'Total Revenue',
          subtitle: 'Complete revenue breakdown',
          icon: 'fa-wallet',
          iconBg: 'bg-emerald-100',
          iconColor: 'text-emerald-600',
          headerBg: 'bg-gradient-to-r from-emerald-50 to-white',
          content: (
            <div className="space-y-5">
              {/* Summary */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-5 text-center">
                <p className="text-sm text-emerald-700 font-medium mb-1">All-Time Revenue</p>
                <p className="text-3xl font-extrabold text-emerald-800">{formatFull(totals.totalRevenue)}</p>
              </div>

              {/* Breakdown */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="fas fa-chart-pie text-gray-400 text-xs"></i>Revenue Sources
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-8 bg-emerald-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Subscriptions</p>
                        <p className="text-xs text-gray-500">{engagement.premiumUsers || 0} premium users × ₹868/mo</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-gray-900">{formatFull(totals.subscriptionRevenue)}</p>
                      <p className="text-xs font-semibold text-emerald-600">{subPct.toFixed(1)}% contribution</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-8 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Platform Fees</p>
                        <p className="text-xs text-gray-500">{recentFees.length} transactions · Avg {avgFeeRate.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-gray-900">{formatFull(totals.platformFees)}</p>
                      <p className="text-xs font-semibold text-blue-600">{feePct.toFixed(1)}% contribution</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Visual breakdown bar */}
              <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 transition-all" style={{ width: `${subPct}%` }}></div>
                <div className="bg-blue-500 transition-all" style={{ width: `${feePct}%` }}></div>
              </div>

              {/* Monthly trend */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <i className="fas fa-chart-bar text-gray-400 text-xs"></i>Monthly Trend (Last 12 Months)
                </h4>
                <div className="flex items-end gap-1 h-20 bg-gray-50 rounded-lg p-2">
                  {normalizedMonthly.map((m, i) => {
                    const h = maxMonthlyRevenueNorm > 0 ? (m.totalRevenue / maxMonthlyRevenueNorm) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
                        <div className="w-full bg-emerald-400 hover:bg-emerald-500 rounded-t transition-colors min-h-[2px]" style={{ height: `${Math.max(h, 3)}%` }} title={`${m.label}: ${formatCurrency(m.totalRevenue)}`}></div>
                        <span className="text-[8px] text-gray-400 group-hover:text-gray-600">{m.label.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        };

      case 'thisMonth':
        const currentMonth = normalizedMonthly[normalizedMonthly.length - 1] || {};
        const lastMonth = normalizedMonthly[normalizedMonthly.length - 2] || {};
        const subContribThisMonth = currentMonth.totalRevenue > 0 ? ((currentMonth.subscriptionRevenue / currentMonth.totalRevenue) * 100) : 0;
        const feeContribThisMonth = currentMonth.totalRevenue > 0 ? ((currentMonth.platformFeeRevenue / currentMonth.totalRevenue) * 100) : 0;
        return {
          title: 'This Month Revenue',
          subtitle: currentMonth.label || 'Current Month',
          icon: 'fa-calendar-day',
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          headerBg: 'bg-gradient-to-r from-blue-50 to-white',
          content: (
            <div className="space-y-5">
              {/* Current vs Last Month comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-xl p-4 text-center border-2 border-blue-200">
                  <p className="text-xs text-blue-600 font-medium mb-1">This Month</p>
                  <p className="text-2xl font-extrabold text-blue-800">{formatFull(totals.thisMonthRevenue)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 font-medium mb-1">Last Month</p>
                  <p className="text-2xl font-extrabold text-gray-700">{formatFull(lastMonth.totalRevenue || 0)}</p>
                </div>
              </div>

              {/* Growth indicator */}
              <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${totals.revenueGrowth >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                {totals.revenueGrowth >= 0 ? (
                  <i className="fas fa-arrow-up text-emerald-600"></i>
                ) : (
                  <i className="fas fa-arrow-down text-red-600"></i>
                )}
                <span className={`text-lg font-bold ${totals.revenueGrowth >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {Math.abs(totals.revenueGrowth)}% {totals.revenueGrowth >= 0 ? 'growth' : 'decline'} vs last month
                </span>
              </div>

              {/* This month breakdown */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">This Month Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>Subscriptions
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(currentMonth.subscriptionRevenue || 0)}</span>
                      <span className="text-xs text-gray-400 ml-2">{subContribThisMonth.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>Platform Fees
                    </span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{formatCurrency(currentMonth.platformFeeRevenue || 0)}</span>
                      <span className="text-xs text-gray-400 ml-2">{feeContribThisMonth.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>Jobs Posted
                    </span>
                    <span className="text-sm font-bold text-gray-900">{currentMonth.jobsPosted || 0}</span>
                  </div>
                </div>
              </div>

              {/* 6-month trend */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">Recent Trend</h4>
                <div className="flex items-end gap-2 h-16">
                  {normalizedMonthly.slice(-6).map((m, i) => {
                    const h = maxMonthlyRevenueNorm > 0 ? (m.totalRevenue / maxMonthlyRevenueNorm) * 100 : 0;
                    const isCurrent = i === 5;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-full rounded-t transition-colors min-h-[2px] ${isCurrent ? 'bg-blue-500' : 'bg-gray-300'}`} style={{ height: `${Math.max(h, 4)}%` }}></div>
                        <span className={`text-[9px] font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>{m.label.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        };

      case 'platformFees':
        return {
          title: 'Platform Fees',
          subtitle: 'Transaction-based revenue',
          icon: 'fa-percentage',
          iconBg: 'bg-purple-100',
          iconColor: 'text-purple-600',
          headerBg: 'bg-gradient-to-r from-purple-50 to-white',
          content: (
            <div className="space-y-5">
              <div className="bg-purple-50 rounded-xl p-5 text-center">
                <p className="text-sm text-purple-700 font-medium mb-1">Total Platform Fees Collected</p>
                <p className="text-3xl font-extrabold text-purple-800">{formatFull(totals.platformFees)}</p>
                <p className="text-xs text-purple-600 mt-1">{feePct.toFixed(1)}% of total revenue</p>
              </div>

              {/* Fee rate distribution */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">Fee Rate Analysis</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Average Rate</p>
                    <p className="text-xl font-bold text-purple-700">{avgFeeRate.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Min Rate</p>
                    <p className="text-xl font-bold text-green-600">2%</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Max Rate</p>
                    <p className="text-xl font-bold text-red-600">8%</p>
                  </div>
                </div>
              </div>

              {/* Transaction stats */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">Transaction Stats</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total Transactions</span>
                    <span className="text-sm font-bold">{recentFees.length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Average Fee per Transaction</span>
                    <span className="text-sm font-bold">{formatCurrency(recentFees.length > 0 ? totals.platformFees / recentFees.length : 0)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Total Budget Processed</span>
                    <span className="text-sm font-bold">{formatCurrency(recentFees.reduce((s, f) => s + f.budget, 0))}</span>
                  </div>
                </div>
              </div>

              {/* Recent transactions preview */}
              {recentFees.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3">Recent Collections</h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {recentFees.slice(0, 5).map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                        <span className="text-gray-600 truncate max-w-[150px]">{f.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">{f.feeRate}%</span>
                          <span className="font-bold text-gray-900">{formatCurrency(f.feeAmount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        };

      case 'subscriptions':
        return {
          title: 'Subscription Revenue',
          subtitle: 'Premium membership earnings',
          icon: 'fa-crown',
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          headerBg: 'bg-gradient-to-r from-yellow-50 to-white',
          content: (
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-yellow-50 to-amber-100/50 rounded-xl p-5 text-center">
                <p className="text-sm text-yellow-700 font-medium mb-1">Total Subscription Revenue</p>
                <p className="text-3xl font-extrabold text-yellow-800">{formatFull(totals.subscriptionRevenue)}</p>
                <p className="text-xs text-yellow-600 mt-1">{subPct.toFixed(1)}% of total revenue</p>
              </div>

              {/* Premium user metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Premium Users</p>
                  <p className="text-2xl font-bold text-yellow-700">{engagement.premiumUsers || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Conversion Rate</p>
                  <p className="text-2xl font-bold text-emerald-600">{engagement.conversionRate || 0}%</p>
                </div>
              </div>

              {/* Revenue per user */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">User Economics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Monthly Price</span>
                    <span className="text-sm font-bold">₹868</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Revenue per Premium User</span>
                    <span className="text-sm font-bold">{formatCurrency(engagement.premiumUsers > 0 ? totals.subscriptionRevenue / engagement.premiumUsers : 0)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <span className="text-sm font-bold">{engagement.activeUsers || 0}</span>
                  </div>
                </div>
              </div>

              {/* Monthly subscription trend */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">Monthly Subscription Revenue</h4>
                <div className="flex items-end gap-1 h-20 bg-gray-50 rounded-lg p-2">
                  {normalizedMonthly.map((m, i) => {
                    const maxSub = Math.max(...normalizedMonthly.map(x => x.subscriptionRevenue), 1);
                    const h = maxSub > 0 ? (m.subscriptionRevenue / maxSub) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group">
                        <div className="w-full bg-yellow-400 hover:bg-yellow-500 rounded-t transition-colors min-h-[2px]" style={{ height: `${Math.max(h, 3)}%` }} title={`${m.label}: ${formatCurrency(m.subscriptionRevenue)}`}></div>
                        <span className="text-[8px] text-gray-400 group-hover:text-gray-600">{m.label.split(' ')[0]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        };

      case 'avgMonthly':
        return {
          title: 'Monthly Average',
          subtitle: 'Performance analysis',
          icon: 'fa-chart-line',
          iconBg: 'bg-cyan-100',
          iconColor: 'text-cyan-600',
          headerBg: 'bg-gradient-to-r from-cyan-50 to-white',
          content: (
            <div className="space-y-5">
              <div className="bg-cyan-50 rounded-xl p-5 text-center">
                <p className="text-sm text-cyan-700 font-medium mb-1">Average Monthly Revenue</p>
                <p className="text-3xl font-extrabold text-cyan-800">{formatFull(avgMonthlyRevenue)}</p>
              </div>

              {/* Best/Worst months */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-lg p-4 text-center border border-emerald-200">
                  <p className="text-xs text-emerald-600 mb-1">Best Month</p>
                  <p className="text-lg font-bold text-emerald-700">{bestMonth?.label}</p>
                  <p className="text-sm font-extrabold text-emerald-800">{formatCurrency(bestMonth?.totalRevenue || 0)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Months</p>
                  <p className="text-lg font-bold text-gray-700">12</p>
                  <p className="text-sm text-gray-500">Tracked Period</p>
                </div>
              </div>

              {/* Monthly breakdown table */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">Monthly Breakdown</h4>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Month</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Revenue</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-600">vs Avg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {normalizedMonthly.map((m, i) => {
                        const diff = avgMonthlyRevenue > 0 ? ((m.totalRevenue - avgMonthlyRevenue) / avgMonthlyRevenue) * 100 : 0;
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-700">{m.label}</td>
                            <td className="px-3 py-2 text-right font-semibold">{formatCurrency(m.totalRevenue)}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {diff >= 0 ? '+' : ''}{diff.toFixed(0)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )
        };

      case 'revenuePerUser':
        return {
          title: 'Revenue per User',
          subtitle: 'User value metrics',
          icon: 'fa-user-tag',
          iconBg: 'bg-pink-100',
          iconColor: 'text-pink-600',
          headerBg: 'bg-gradient-to-r from-pink-50 to-white',
          content: (
            <div className="space-y-5">
              <div className="bg-pink-50 rounded-xl p-5 text-center">
                <p className="text-sm text-pink-700 font-medium mb-1">Average Revenue per User</p>
                <p className="text-3xl font-extrabold text-pink-800">{formatFull(revenuePerUser)}</p>
              </div>

              {/* User breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Active Users</p>
                  <p className="text-2xl font-bold text-gray-700">{engagement.activeUsers || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.totalRevenue)}</p>
                </div>
              </div>

              {/* Value tiers */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3">User Value Analysis</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <span className="text-sm text-gray-600">Premium User Value</span>
                    <span className="text-sm font-bold text-yellow-700">{formatCurrency(engagement.premiumUsers > 0 ? totals.subscriptionRevenue / engagement.premiumUsers : 0)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Avg Fee per Transaction</span>
                    <span className="text-sm font-bold">{formatCurrency(recentFees.length > 0 ? totals.platformFees / recentFees.length : 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        };

      default:
        return null;
    }
  };

  return (
    <DashboardPage title="Admin Dashboard">
      {/* ─── Featured: This Month Income ─── */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* This Month */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-day text-white"></i>
                </div>
                <span className="text-sm font-medium text-blue-200 uppercase tracking-wider">This Month</span>
                {totals.revenueGrowth !== 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${totals.revenueGrowth > 0 ? 'bg-emerald-500/30 text-emerald-200' : 'bg-red-500/30 text-red-200'}`}>
                    {totals.revenueGrowth > 0 ? '+' : ''}{totals.revenueGrowth}%
                  </span>
                )}
              </div>
              <p className="text-4xl lg:text-5xl font-extrabold">{formatFull(totals.thisMonthRevenue)}</p>
              <p className="text-blue-200 text-sm mt-1">{normalizedMonthly[normalizedMonthly.length - 1]?.label || 'Current Month'}</p>
            </div>

            {/* Divider */}
            <div className="hidden lg:block w-px h-20 bg-white/20"></div>

            {/* Total Revenue */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <i className="fas fa-wallet text-white"></i>
                </div>
                <span className="text-sm font-medium text-blue-200 uppercase tracking-wider">Total Earned</span>
              </div>
              <p className="text-4xl lg:text-5xl font-extrabold">{formatFull(totals.totalRevenue)}</p>
              <p className="text-blue-200 text-sm mt-1">All-time revenue</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3 lg:w-64">
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold">{engagement.premiumUsers || 0}</p>
                <p className="text-[10px] text-blue-200 uppercase">Premium Users</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-2xl font-bold">{engagement.conversionRate || 0}%</p>
                <p className="text-[10px] text-blue-200 uppercase">Conversion</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Clickable KPI Ribbon ─── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl p-1 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x divide-slate-700">
          <KPIItem
            label="Total Revenue"
            value={formatCurrency(totals.totalRevenue)}
            icon="fa-coins"
            accent="text-emerald-400"
            onClick={() => setActiveModal('totalRevenue')}
          />
          <KPIItem
            label="This Month"
            value={formatCurrency(totals.thisMonthRevenue)}
            icon="fa-calendar-day"
            accent="text-blue-400"
            badge={totals.revenueGrowth !== 0 ? { 
              text: `${totals.revenueGrowth > 0 ? '+' : ''}${totals.revenueGrowth}%`, 
              color: totals.revenueGrowth > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400' 
            } : null}
            onClick={() => setActiveModal('thisMonth')}
          />
          <KPIItem
            label="Platform Fees"
            value={formatCurrency(totals.platformFees)}
            icon="fa-percentage"
            accent="text-purple-400"
            onClick={() => setActiveModal('platformFees')}
          />
          <KPIItem
            label="Subscriptions"
            value={formatCurrency(totals.subscriptionRevenue)}
            icon="fa-crown"
            accent="text-yellow-400"
            onClick={() => setActiveModal('subscriptions')}
          />
          <KPIItem
            label="Avg/Month"
            value={formatCurrency(avgMonthlyRevenue)}
            icon="fa-chart-line"
            accent="text-cyan-400"
            onClick={() => setActiveModal('avgMonthly')}
          />
          <KPIItem
            label="Rev / User"
            value={formatCurrency(revenuePerUser)}
            icon="fa-user-tag"
            accent="text-pink-400"
            onClick={() => setActiveModal('revenuePerUser')}
          />
        </div>
      </div>

      {/* Metric Detail Modal */}
      <MetricModal
        isOpen={!!activeModal}
        onClose={() => setActiveModal(null)}
        metric={activeModal ? getModalContent(activeModal) : null}
      />

      {/* ─── Monthly Revenue Chart with Gridlines ─── */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Monthly Revenue Trend</h3>
            <p className="text-[11px] text-gray-400">Last 12 months · Click any bar for details</p>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>Subscriptions</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block"></span>Platform Fees</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-px bg-slate-400 inline-block border-t border-dashed border-slate-400" style={{width: '10px'}}></span>Cumulative</span>
          </div>
        </div>
        <div className="px-5 py-5">
          {/* Y-axis scale + chart area */}
          <div className="flex gap-2">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between h-56 text-[9px] text-gray-400 font-medium py-1 w-12 text-right flex-shrink-0">
              <span>{formatCurrency(maxMonthlyRevenueNorm)}</span>
              <span>{formatCurrency(maxMonthlyRevenueNorm * 0.75)}</span>
              <span>{formatCurrency(maxMonthlyRevenueNorm * 0.5)}</span>
              <span>{formatCurrency(maxMonthlyRevenueNorm * 0.25)}</span>
              <span>₹0</span>
            </div>
            {/* Chart */}
            <div className="flex-1 relative">
              {/* Horizontal grid lines */}
              {[0, 25, 50, 75, 100].map(pct => (
                <div key={pct} className="absolute left-0 right-0 border-t border-dashed border-gray-100" style={{ bottom: `${pct}%` }}></div>
              ))}
              {/* Cumulative line overlay */}
              <svg className="absolute inset-0 w-full h-56 pointer-events-none z-10" viewBox={`0 0 ${normalizedMonthly.length * 100} 100`} preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  points={cumulative.map((c, i) => `${i * 100 + 50},${100 - (c / maxCum) * 90}`).join(' ')}
              />
              </svg>
              {/* Bars */}
              <div className="flex items-end gap-1.5 h-56 relative">
                {normalizedMonthly.map((m, i) => {
                  const subH = maxMonthlyRevenueNorm > 0 ? (m.subscriptionRevenue / maxMonthlyRevenueNorm) * 100 : 0;
                  const feeH = maxMonthlyRevenueNorm > 0 ? (m.platformFeeRevenue / maxMonthlyRevenueNorm) * 100 : 0;
                  const isCurrentMonth = i === normalizedMonthly.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                      {/* Tooltip */}
                      <div className={`absolute bottom-full mb-2 hidden group-hover:block z-50 pointer-events-auto ${i >= normalizedMonthly.length - 2 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}>
                        <div className="bg-white text-gray-800 text-[11px] rounded-lg px-3.5 py-2.5 whitespace-nowrap shadow-xl border border-gray-200">
                          <p className="font-bold text-sm mb-1 text-gray-900">{m.label}</p>
                          <div className="space-y-1">
                            <div className="flex justify-between gap-6">
                              <span className="text-gray-500">Subscriptions</span>
                              <span className="font-semibold text-gray-800">{formatFull(m.subscriptionRevenue)}</span>
                            </div>
                            <div className="flex justify-between gap-6">
                              <span className="text-gray-500">Platform Fees</span>
                              <span className="font-semibold text-gray-800">{formatFull(m.platformFeeRevenue)}</span>
                            </div>
                            <div className="border-t border-gray-200 mt-1 pt-1 flex justify-between gap-6">
                              <span className="text-gray-700 font-bold">Total</span>
                              <span className="font-bold text-emerald-600">{formatFull(m.totalRevenue)}</span>
                            </div>
                            <div className="flex justify-between gap-6 text-gray-400">
                              <span>Jobs posted</span>
                              <span>{m.jobsPosted}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Value label */}
                      {m.totalRevenue > 0 && (
                        <p className="text-[9px] text-gray-400 mb-0.5 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">{formatCurrency(m.totalRevenue)}</p>
                      )}
                      {/* Stacked bar */}
                      <div className="w-full flex flex-col justify-end" style={{ height: '200px' }}>
                        {m.totalRevenue === 0 ? (
                          <div className="w-full bg-gray-200 rounded-t" style={{ height: '4px' }}></div>
                        ) : (
                          <>
                            <div
                              className={`w-full rounded-t transition-all duration-300 ${isCurrentMonth ? 'bg-blue-600' : 'bg-blue-400 group-hover:bg-blue-500'}`}
                              style={{ height: `${Math.max(feeH, 2)}%` }}
                            ></div>
                            <div
                              className={`w-full transition-all duration-300 ${isCurrentMonth ? 'bg-emerald-600' : 'bg-emerald-400 group-hover:bg-emerald-500'}`}
                              style={{ height: `${Math.max(subH, 2)}%` }}
                            ></div>
                          </>
                        )}
                      </div>
                      {/* Month label */}
                      <p className={`text-[9px] mt-1.5 font-semibold ${isCurrentMonth ? 'text-slate-900' : 'text-gray-400'}`}>{m.label}</p>
                      {isCurrentMonth && <div className="w-1 h-1 rounded-full bg-blue-500 mt-0.5"></div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Summary row under chart */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-gray-400">Best Month:</span>
              <span className="font-bold text-gray-700">{bestMonth?.label}</span>
              <span className="text-emerald-600 font-semibold">{formatCurrency(bestMonth?.totalRevenue || 0)}</span>
            </div>
            <div className="w-px h-3 bg-gray-200"></div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-gray-400">Monthly Avg:</span>
              <span className="font-bold text-gray-700">{formatCurrency(avgMonthlyRevenue)}</span>
            </div>
            <div className="w-px h-3 bg-gray-200"></div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-gray-400">Total Jobs:</span>
              <span className="font-bold text-gray-700">{normalizedMonthly.reduce((s, m) => s + (m.jobsPosted || 0), 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Three-Column: Engagement · Revenue Breakdown · Quick Pulse ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Engagement Metrics */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Engagement Metrics</h3>
            <span className="text-[10px] font-semibold text-slate-400 uppercase">Last 30 Days</span>
          </div>
          <div className="p-5 space-y-3.5">
            {[
              { label: 'Job Completion', value: engagement.jobCompletionRate, color: 'emerald', icon: 'fa-check-circle' },
              { label: 'Hire Rate', value: engagement.hireRate, color: 'blue', icon: 'fa-handshake' },
              { label: 'Premium Conversion', value: engagement.conversionRate, color: 'amber', icon: 'fa-crown' },
            ].map((metric, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 flex items-center gap-1.5">
                    <i className={`fas ${metric.icon} text-${metric.color}-500 text-[10px]`}></i>
                    {metric.label}
                  </span>
                  <span className="text-xs font-extrabold text-gray-900">{metric.value}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`bg-${metric.color}-500 h-2 rounded-full transition-all duration-700`} style={{ width: `${Math.min(metric.value, 100)}%` }}></div>
                </div>
              </div>
            ))}

            <div className="border-t border-gray-100 pt-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Active Users', value: engagement.activeUsers || 0, color: 'blue' },
                  { label: 'New Jobs', value: engagement.recentJobs || 0, color: 'green' },
                  { label: 'Applications', value: engagement.recentApplications || 0, color: 'purple' },
                  { label: 'Avg Jobs/Mo', value: engagement.avgJobsPerMonth || 0, color: 'orange' },
                ].map((stat, i) => (
                  <div key={i} className={`bg-${stat.color}-50 rounded-lg px-3 py-2`}>
                    <p className={`text-lg font-extrabold text-${stat.color}-700 leading-none`}>{stat.value}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Revenue Breakdown</h3>
          </div>
          <div className="p-5">
            {/* Donut Chart */}
            <div className="flex items-center gap-5 mb-5">
              <div className="relative w-[100px] h-[100px] flex-shrink-0">
                <div
                  className="w-full h-full rounded-full"
                  style={{
                    background: `conic-gradient(#10b981 0% ${subPct}%, #3b82f6 ${subPct}% 100%)`,
                  }}
                >
                  <div className="w-[68px] h-[68px] bg-white rounded-full absolute top-4 left-4 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-gray-900">{formatCurrency(totals.totalRevenue)}</span>
                    <span className="text-[8px] text-gray-400">TOTAL</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                {[
                  { label: 'Subscriptions', amount: totals.subscriptionRevenue, pct: subPct, color: 'emerald' },
                  { label: 'Platform Fees', amount: totals.platformFees, pct: feePct, color: 'blue' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span className={`w-2.5 h-2.5 rounded-full bg-${item.color}-500`}></span>
                        {item.label}
                      </span>
                      <span className="text-xs font-bold text-gray-400">{item.pct.toFixed(0)}%</span>
                    </div>
                    <p className="text-base font-extrabold text-gray-900 ml-4">{formatFull(item.amount)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Health indicators */}
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Revenue / Premium User</span>
                <span className="font-bold text-gray-800">{formatCurrency(engagement.premiumUsers > 0 ? totals.subscriptionRevenue / engagement.premiumUsers : 0)}/user</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Avg Fee per Transaction</span>
                <span className="font-bold text-gray-800">{formatCurrency(recentFees.length > 0 ? recentFees.reduce((s, f) => s + f.feeAmount, 0) / recentFees.length : 0)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Best Month</span>
                <span className="font-bold text-emerald-600">{bestMonth?.label} ({formatCurrency(bestMonth?.totalRevenue || 0)})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Monthly Breakdown</h3>
            <span className="text-[10px] text-gray-400">12 months</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase">Month</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Subs</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Fees</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {normalizedMonthly.map((m, i) => {
                  const isCurrentMonth = i === normalizedMonthly.length - 1;
                  return (
                    <tr key={i} className={`${isCurrentMonth ? 'bg-blue-50/50' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-3 py-2 text-xs font-medium text-gray-700">
                        {isCurrentMonth && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span>}
                        {m.label}
                      </td>
                      <td className="px-3 py-2 text-xs text-right text-gray-600">{formatCurrency(m.subscriptionRevenue)}</td>
                      <td className="px-3 py-2 text-xs text-right text-gray-600">{formatCurrency(m.platformFeeRevenue)}</td>
                      <td className="px-3 py-2 text-xs text-right font-bold text-gray-900">{formatCurrency(m.totalRevenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td className="px-3 py-2 text-[11px] font-bold text-gray-700">Total</td>
                  <td className="px-3 py-2 text-[11px] text-right font-bold text-emerald-600">{formatCurrency(totals.subscriptionRevenue)}</td>
                  <td className="px-3 py-2 text-[11px] text-right font-bold text-blue-600">{formatCurrency(totals.platformFees)}</td>
                  <td className="px-3 py-2 text-[11px] text-right font-extrabold text-gray-900">{formatCurrency(totals.totalRevenue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Platform Fee Structure ─── */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Platform Fee Structure</h3>
            <p className="text-[11px] text-gray-400">Base rate: <span className="font-semibold text-gray-600">{feeTiers.baseRate}%</span> · Effective range: <span className="font-semibold text-gray-600">{feeTiers.range || '2.5% – 6%'}</span></p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-16 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 h-2 rounded-full"></div>
            <span className="text-[9px] text-gray-400">Low → High</span>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Platform Type */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <i className="fas fa-bolt text-[10px] text-amber-400"></i>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Platform Fee</p>
            </div>
            <div className="space-y-1">
              {(feeTiers.tiers?.platform || [
                { range: 'Standard job', modifier: '2%' },
                { range: 'Boosted job', modifier: '4%' },
              ]).map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="text-gray-600 font-medium">{t.range}</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">{t.modifier}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Application Cap Fee */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <i className="fas fa-users text-[10px] text-gray-400"></i>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Application Cap Fee</p>
            </div>
            <div className="space-y-1">
              {(feeTiers.tiers?.applicationCap || [
                { range: '≤ 10 applicants', modifier: '0%' },
                { range: '≤ 25 applicants', modifier: '+0.5%' },
                { range: '≤ 50 applicants', modifier: '+1%' },
                { range: 'Unlimited', modifier: '+2%' },
              ]).map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <span className="text-gray-600 font-medium">{t.range}</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700">{t.modifier}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Recent Platform Fee Collections ─── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Recent Platform Fee Collections</h3>
            <p className="text-[11px] text-gray-400">{recentFees.length} shown · total {totalFeeCollections} · Page {feePage}</p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full">
            <i className="fas fa-check-circle mr-1 text-[9px]"></i>{totalFeeCollections} Collected
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Job Title</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Employer</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Applicants</th>
                <th className="px-4 py-2.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fee Rate</th>
                <th className="px-4 py-2.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fee Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentFees.length > 0 ? recentFees.map((job, i) => (
                <tr key={i} className={`${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} hover:bg-blue-50/40 transition-colors`}>
                  <td className="px-4 py-2.5 text-[11px] text-gray-400 font-medium">{(feePage - 1) * feePageSize + i + 1}</td>
                  <td className="px-4 py-2.5">
                    <p className="text-xs font-semibold text-gray-900 truncate max-w-[180px]">{job.title}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600">{job.employerName}</td>
                  <td className="px-4 py-2.5 text-xs text-right font-semibold text-gray-800">{formatFull(job.budget)}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium">{job.durationDays}d</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[11px] font-medium">{job.applicantCount}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      job.feeRate >= 7 ? 'bg-red-100 text-red-700' :
                      job.feeRate >= 6 ? 'bg-orange-100 text-orange-700' :
                      job.feeRate >= 5 ? 'bg-yellow-100 text-yellow-700' :
                      job.feeRate >= 4 ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {job.feeRate}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-right font-extrabold text-emerald-600">{formatFull(job.feeAmount)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No platform fee transactions yet</td>
                </tr>
              )}
            </tbody>
            {recentFees.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 border-t border-gray-200">
                  <td colSpan={3} className="px-4 py-2.5 text-[11px] font-bold text-gray-600">Totals</td>
                  <td className="px-4 py-2.5 text-xs text-right font-bold text-gray-800">{formatFull(recentFees.reduce((s, f) => s + f.budget, 0))}</td>
                  <td className="px-4 py-2.5"></td>
                  <td className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500">avg {(recentFees.reduce((s, f) => s + f.applicantCount, 0) / recentFees.length).toFixed(0)}</td>
                  <td className="px-4 py-2.5 text-center text-[11px] font-bold text-gray-600">avg {avgFeeRate.toFixed(1)}%</td>
                  <td className="px-4 py-2.5 text-xs text-right font-extrabold text-emerald-700">{formatFull(recentFees.reduce((s, f) => s + f.feeAmount, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-gray-500">
            Showing {recentFees.length} on this page (total {totalFeeCollections})
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">Rows:</label>
            <select
              value={feePageSize}
              onChange={(e) => handleFeePageSizeChange(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-md text-xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <button
              onClick={handleFeePrevPage}
              disabled={loading || feePage <= 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>
            <button
              onClick={handleFeeNextPage}
              disabled={loading || !feePagination?.hasNextPage}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </DashboardPage>
  );
};

export default AdminDashboard;

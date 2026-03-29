import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';
import SmartSearchInput from '../../components/SmartSearchInput';
import SmartFilter from '../../components/SmartFilter';
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

const ACTIVE_SORT_OPTIONS = [
  { value: 'budget-high', label: 'Budget (High to Low)' },
  { value: 'budget-low', label: 'Budget (Low to High)' },
  { value: 'earned-high', label: 'Earned (High to Low)' },
  { value: 'earned-low', label: 'Earned (Low to High)' },
  { value: 'pending-high', label: 'Pending (High to Low)' },
  { value: 'pending-low', label: 'Pending (Low to High)' },
  { value: 'progress-high', label: 'Progress (High to Low)' },
  { value: 'progress-low', label: 'Progress (Low to High)' },
];

const PAST_SORT_OPTIONS = [
  { value: 'earned-high', label: 'Earned (High to Low)' },
  { value: 'earned-low', label: 'Earned (Low to High)' },
  { value: 'newest', label: 'Most Recent' },
  { value: 'oldest', label: 'Oldest First' },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'finished', label: 'Completed' },
  { value: 'left', label: 'Left' },
];

const PLATFORM_COLUMNS = [
  { key: 'type', label: 'Type' },
  { key: 'amount', label: 'Amount' },
  { key: 'plan', label: 'Plan Details' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
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
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [activeSortBy, setActiveSortBy] = useState('budget-high');
  const [pastSearchTerm, setPastSearchTerm] = useState('');
  const [pastSortBy, setPastSortBy] = useState('earned-high');
  const [activeColumnFilters, setActiveColumnFilters] = useState({ status: [], employer: [], job: [] });
  const setActiveColFilter = (field) => (values) => setActiveColumnFilters(prev => ({ ...prev, [field]: values }));
  const [pastColumnFilters, setPastColumnFilters] = useState({ status: [], employer: [], job: [] });
  const setPastColFilter = (field) => (values) => setPastColumnFilters(prev => ({ ...prev, [field]: values }));
  const [platformPayments, setPlatformPayments] = useState([]);
  const [loadingPlatform, setLoadingPlatform] = useState(true);
  const [viewMode, setViewMode] = useState('projects'); // 'projects' | 'platform'
  
  // Platform Spending Controls
  const [platformSearchTerm, setPlatformSearchTerm] = useState('');
  const [platformSortBy, setPlatformSortBy] = useState('newest');
  const [platformColumnFilters, setPlatformColumnFilters] = useState({ typeLabel: [], plan: [] });
  const setPlatformColFilter = (field) => (values) => setPlatformColumnFilters(prev => ({ ...prev, [field]: values }));
  
  const navigate = useNavigate();

  const activeCols = useSmartColumnToggle(ACTIVE_COLUMNS, 'payments-active-cols');
  const completedCols = useSmartColumnToggle(COMPLETED_COLUMNS, 'payments-completed-cols');
  const platformCols = useSmartColumnToggle(PLATFORM_COLUMNS, 'payments-platform-cols');

  useEffect(() => { fetchPayments(); fetchPlatformPayments(); }, []);

  const fetchPlatformPayments = async () => {
    try {
      setLoadingPlatform(true);
      const res = await fetch(`${API_BASE_URL}/api/payment/my-payments`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setPlatformPayments(data.payments || []);
    } catch (_) { /* silent */ }
    finally { setLoadingPlatform(false); }
  };

  const verifiedPlatformPayments = useMemo(() => {
    return platformPayments
      .filter(p => p.status === 'verified')
      .map(p => ({
         ...p,
         typeLabel: p.paymentType === 'subscription' ? 'Premium Subscription' : p.paymentType === 'fee' ? 'Platform Fee' : (p.paymentType || 'Payment'),
         planDetails: p.metadata?.planDuration ? `${p.metadata.planDuration} months` : '—'
      }));
  }, [platformPayments]);
  
  const totalPlatformSpending = useMemo(
    () => verifiedPlatformPayments.reduce((s, p) => s + (p.amount || 0), 0) / 100,
    [verifiedPlatformPayments]
  );

  const thisMonthSpending = useMemo(() => {
    const now = new Date();
    return verifiedPlatformPayments.filter(p => {
       const d = new Date(p.createdAt);
       return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((s, p) => s + (p.amount || 0), 0) / 100;
  }, [verifiedPlatformPayments]);

  const latestTransactionAmount = useMemo(() => {
    // Already sorted by newest in backend, but just in case
    const sorted = [...verifiedPlatformPayments].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sorted.length > 0 ? (sorted[0].amount || 0) / 100 : 0;
  }, [verifiedPlatformPayments]);

  const processedPlatformPayments = useMemo(() => {
    let result = [...verifiedPlatformPayments];

    // Column Filters
    if (platformColumnFilters.typeLabel && platformColumnFilters.typeLabel.length > 0) {
      result = result.filter(p => platformColumnFilters.typeLabel.includes(p.typeLabel));
    }
    if (platformColumnFilters.plan && platformColumnFilters.plan.length > 0) {
      result = result.filter(p => platformColumnFilters.plan.includes(p.planDetails));
    }
    
    // Search
    if (platformSearchTerm) {
      const term = platformSearchTerm.toLowerCase();
      result = result.filter(p => {
         return p.typeLabel.toLowerCase().includes(term) || p.planDetails.toLowerCase().includes(term);
      });
    }

    // Sort
    if (platformSortBy === 'newest') result.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (platformSortBy === 'oldest') result.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (platformSortBy === 'amount-high') result.sort((a,b) => (b.amount || 0) - (a.amount || 0));
    else if (platformSortBy === 'amount-low') result.sort((a,b) => (a.amount || 0) - (b.amount || 0));

    return result;
  }, [verifiedPlatformPayments, platformSearchTerm, platformSortBy, platformColumnFilters]);

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
      <span className={`inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-sm font-medium ${bg} ${text}`}>
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

  const processedActivePayments = useMemo(() => {
    let list = payments.filter((p) => p.status === 'working');

    // Column filters
    if (activeColumnFilters.status.length > 0) {
      list = list.filter(p => activeColumnFilters.status.includes(p.status));
    }
    if (activeColumnFilters.employer.length > 0) {
      list = list.filter(p => activeColumnFilters.employer.includes(p.employerName));
    }
    if (activeColumnFilters.job.length > 0) {
      list = list.filter(p => activeColumnFilters.job.includes(p.jobTitle));
    }
    
    // Search
    if (activeSearchTerm) {
      const q = activeSearchTerm.toLowerCase();
      list = list.filter(p =>
        p.jobTitle?.toLowerCase().includes(q) ||
        p.employerName?.toLowerCase().includes(q) ||
        p.companyName?.toLowerCase().includes(q)
      );
    }
    
    // Sort
    const sorted = [...list];
    switch (activeSortBy) {
      case 'budget-high': sorted.sort((a, b) => (b.totalBudget || 0) - (a.totalBudget || 0)); break;
      case 'budget-low': sorted.sort((a, b) => (a.totalBudget || 0) - (b.totalBudget || 0)); break;
      case 'earned-high': sorted.sort((a, b) => (b.paidAmount || 0) - (a.paidAmount || 0)); break;
      case 'earned-low': sorted.sort((a, b) => (a.paidAmount || 0) - (b.paidAmount || 0)); break;
      case 'pending-high': sorted.sort((a, b) => getRealPending(b) - getRealPending(a)); break;
      case 'pending-low': sorted.sort((a, b) => getRealPending(a) - getRealPending(b)); break;
      case 'progress-high': sorted.sort((a, b) => (b.paymentPercentage || 0) - (a.paymentPercentage || 0)); break;
      case 'progress-low': sorted.sort((a, b) => (a.paymentPercentage || 0) - (b.paymentPercentage || 0)); break;
    }
    return sorted;
  }, [payments, activeSearchTerm, activeSortBy]);

  const processedPastPayments = useMemo(() => {
    let list = payments.filter((p) => p.status === 'finished' || p.status === 'left');
    
    // Status filter
    if (pastColumnFilters.status.length > 0) {
      list = list.filter(p => pastColumnFilters.status.includes(p.status));
    }
    if (pastColumnFilters.employer.length > 0) {
      list = list.filter(p => pastColumnFilters.employer.includes(p.employerName));
    }
    if (pastColumnFilters.job.length > 0) {
      list = list.filter(p => pastColumnFilters.job.includes(p.jobTitle));
    }
    
    // Search
    if (pastSearchTerm) {
      const q = pastSearchTerm.toLowerCase();
      list = list.filter(p =>
        p.jobTitle?.toLowerCase().includes(q) ||
        p.employerName?.toLowerCase().includes(q) ||
        p.companyName?.toLowerCase().includes(q)
      );
    }
    
    // Sort
    const sorted = [...list];
    switch (pastSortBy) {
      case 'earned-high': sorted.sort((a, b) => (b.paidAmount || 0) - (a.paidAmount || 0)); break;
      case 'earned-low': sorted.sort((a, b) => (a.paidAmount || 0) - (b.paidAmount || 0)); break;
      case 'newest': sorted.sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0)); break;
      case 'oldest': sorted.sort((a, b) => new Date(a.startDate || 0) - new Date(b.startDate || 0)); break;
    }
    return sorted;
  }, [payments, pastSearchTerm, pastSortBy, pastColumnFilters]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 -mt-4">
        <p className="text-gray-500">Track your earnings and manage milestone payments</p>
        <button 
          onClick={() => {
            setViewMode(viewMode === 'projects' ? 'platform' : 'projects');
            setPlatformSearchTerm(''); 
          }}
          className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:-translate-y-0.5"
        >
          {viewMode === 'projects' ? (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              Platform Transactions
            </>
          ) : (
             <>
               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
               Back to Projects
             </>
          )}
        </button>
      </div>

      {viewMode === 'projects' ? (
        <>
          {/*   Stat Cards      */}
          {payments.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Earned */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Earned</p>
                <p className="text-2xl font-bold text-green-600">₹{totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </div>
          {/* Pending */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Pending Payments</p>
                <p className="text-2xl font-bold text-orange-600">₹{pendingPayments.toLocaleString()}</p>
              </div>
            </div>
          </div>
          {/* Active */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{activeProjects}</p>
              </div>
            </div>
          </div>
          {/* Completed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedProjects}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*   Active Projects Table    */}
      {payments.filter((p) => p.status === 'working').length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Active Projects</h2>
          </div>
          {/* Search + Sort + Columns */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="flex-1">
                <SmartSearchInput
                  value={activeSearchTerm}
                  onChange={setActiveSearchTerm}
                  dataSource={payments.filter(p => p.status === 'working')}
                  getSearchValue={(item) => item.jobTitle || item.title || ''}
                  placeholder="Search by job title, employer, or company..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={activeSortBy}
                onChange={(e) => setActiveSortBy(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {ACTIVE_SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <SmartColumnToggle columns={ACTIVE_COLUMNS} visible={activeCols.visible} onChange={activeCols.setVisible} storageKey="payments-active-cols" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
                    {activeCols.visible.has('employer') && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          Employer
                          <SmartFilter
                            label="Employer"
                            data={payments.filter(p => p.status === 'working')}
                            field="employerName"
                            selectedValues={activeColumnFilters.employer}
                            onFilterChange={setActiveColFilter('employer')}
                          />
                        </div>
                      </th>
                    )}
                    {activeCols.visible.has('job') && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          Job Details
                          <SmartFilter
                            label="Job"
                            data={payments.filter(p => p.status === 'working')}
                            field="jobTitle"
                            selectedValues={activeColumnFilters.job}
                            onFilterChange={setActiveColFilter('job')}
                          />
                        </div>
                      </th>
                    )}
                    {activeCols.visible.has('status') && (
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1.5">
                          Status
                          <SmartFilter
                            label="Status"
                            data={payments.filter(p => p.status === 'working')}
                            field="status"
                            selectedValues={activeColumnFilters.status}
                            onFilterChange={setActiveColFilter('status')}
                            valueFormatter={(v) => v === 'working' ? 'In Progress' : v}
                          />
                        </div>
                      </th>
                    )}
                    {activeCols.visible.has('progress') && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Payment Progress</th>}
                    {activeCols.visible.has('budget') && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Budget</th>}
                    {activeCols.visible.has('milestones') && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Milestones</th>}
                    {activeCols.visible.has('action') && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {processedActivePayments.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <p className="text-sm font-medium mb-1">No matching projects found</p>
                          <p className="text-xs">Try adjusting your search criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : processedActivePayments.map((payment) => (
                    <tr key={payment.jobId} className="hover:bg-gray-50 transition-colors">
                      {activeCols.visible.has('employer') && (
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            {payment.employerPicture ? (
                              <img className="h-9 w-9 rounded-lg object-cover border border-gray-200 flex-shrink-0" src={payment.employerPicture} alt={payment.employerName} />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-semibold flex-shrink-0 text-sm">
                                {payment.employerName?.charAt(0)?.toUpperCase() || 'E'}
                              </div>
                            )}
                            <p className="text-sm font-medium text-gray-700 truncate">{payment.employerName}</p>
                          </div>
                        </td>
                      )}
                      {activeCols.visible.has('job') && (
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-gray-900">{payment.jobTitle}</p>
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
                          <button onClick={() => handleViewDetails(payment.jobId)} className="inline-flex items-center whitespace-nowrap px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
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
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Past Projects</h2>
          </div>
          {/* Search + Sort + Filter + Columns */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="flex-1">
                <SmartSearchInput
                  value={pastSearchTerm}
                  onChange={setPastSearchTerm}
                  dataSource={payments.filter(p => p.status === 'finished' || p.status === 'left')}
                  getSearchValue={(item) => item.jobTitle || item.title || ''}
                  placeholder="Search by job title, employer, or company..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <select
                value={pastSortBy}
                onChange={(e) => setPastSortBy(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {PAST_SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <SmartColumnToggle columns={COMPLETED_COLUMNS} visible={completedCols.visible} onChange={completedCols.setVisible} storageKey="payments-completed-cols" />
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-green-50 border-b border-gray-100">
                    {completedCols.visible.has('employer') && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          Employer
                          <SmartFilter
                            label="Employer"
                            data={payments.filter(p => p.status === 'finished' || p.status === 'left')}
                            field="employerName"
                            selectedValues={pastColumnFilters.employer}
                            onFilterChange={setPastColFilter('employer')}
                          />
                        </div>
                      </th>
                    )}
                    {completedCols.visible.has('job') && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          Job Details
                          <SmartFilter
                            label="Job"
                            data={payments.filter(p => p.status === 'finished' || p.status === 'left')}
                            field="jobTitle"
                            selectedValues={pastColumnFilters.job}
                            onFilterChange={setPastColFilter('job')}
                          />
                        </div>
                      </th>
                    )}
                    {completedCols.visible.has('status') && (
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-1.5">
                          Status
                          <SmartFilter
                            label="Status"
                            data={payments.filter(p => p.status === 'finished' || p.status === 'left')}
                            field="status"
                            selectedValues={pastColumnFilters.status}
                            onFilterChange={setPastColFilter('status')}
                            valueFormatter={(v) => v === 'finished' ? 'Completed' : v === 'left' ? 'Left' : v}
                          />
                        </div>
                      </th>
                    )}
                    {completedCols.visible.has('earned') && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Total Earned</th>}
                    {completedCols.visible.has('action') && <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {processedPastPayments.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <p className="text-sm font-medium mb-1">No matching projects found</p>
                          <p className="text-xs">Try adjusting your filters or search criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : processedPastPayments.map((payment) => (
                    <tr key={payment.jobId} className="hover:bg-gray-50 transition-colors">
                      {completedCols.visible.has('employer') && (
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            {payment.employerPicture ? (
                              <img className="h-9 w-9 rounded-lg object-cover border border-gray-200 flex-shrink-0" src={payment.employerPicture} alt={payment.employerName} />
                            ) : (
                              <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-semibold flex-shrink-0 text-sm">
                                {payment.employerName?.charAt(0)?.toUpperCase() || 'E'}
                              </div>
                            )}
                            <p className="text-sm font-medium text-gray-700 truncate">{payment.employerName}</p>
                          </div>
                        </td>
                      )}
                      {completedCols.visible.has('job') && (
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-gray-900">{payment.jobTitle}</p>
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
                          <button onClick={() => handleViewDetails(payment.jobId)} className="inline-flex items-center whitespace-nowrap px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
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

      {payments.length > 0 && monthlyData.length > 0 && (
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Earnings Overview</h2>
                <p className="text-sm text-gray-500">Monthly breakdown of your earnings and pending amounts</p>
              </div>
              <div className="flex items-center gap-2">
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
                  <button onClick={() => setChartType('bar')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${chartType === 'bar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Bar</button>
                  <button onClick={() => setChartType('area')} className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${chartType === 'area' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Area</button>
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
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-xs text-gray-600">Earned</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="text-xs text-gray-600">Pending</span></div>
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
        </>
      ) : (
      /* Platform Spending Section */
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1.5 bg-indigo-600 rounded-full"></div>
            <h2 className="text-xl font-bold text-gray-900">Platform Spending</h2>
          </div>
        </div>

        {loadingPlatform ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-3"></div>
            <p className="text-gray-400 text-sm">Loading platform transactions...</p>
          </div>
        ) : verifiedPlatformPayments.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Platform Transactions Yet</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">Your premium subscriptions and other platform purchases will appear here.</p>
          </div>
        ) : (
          <>
            {/* 4 Stat cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">₹{totalPlatformSpending.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">₹{thisMonthSpending.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Latest Txn</p>
                    <p className="text-2xl font-bold text-gray-900">₹{latestTransactionAmount.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Txns</p>
                    <p className="text-2xl font-bold text-gray-900">{verifiedPlatformPayments.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <SmartSearchInput
                  value={platformSearchTerm}
                  onChange={setPlatformSearchTerm}
                  placeholder="Search transactions..."
                />
              </div>
              <div className="flex items-center gap-3 min-w-[200px]">
                <select
                  value={platformSortBy}
                  onChange={(e) => setPlatformSortBy(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer shadow-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="amount-high">Amount: High to Low</option>
                  <option value="amount-low">Amount: Low to High</option>
                </select>
                <SmartColumnToggle 
                  columns={PLATFORM_COLUMNS} 
                  visible={platformCols.visible} 
                  onChange={platformCols.setVisible} 
                />
              </div>
            </div>

            {/* Transactions table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      {platformCols.visible.has('type') && (
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center gap-2">
                            Type
                            <SmartFilter
                              label="Type"
                              data={verifiedPlatformPayments}
                              field="typeLabel"
                              selectedValues={platformColumnFilters.typeLabel || []}
                              onFilterChange={setPlatformColFilter('typeLabel')}
                            />
                          </div>
                        </th>
                      )}
                      {platformCols.visible.has('amount') && (
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Amount</th>
                      )}
                      {platformCols.visible.has('plan') && (
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                          <div className="flex items-center justify-center gap-2">
                            Plan Details
                            <SmartFilter
                              label="Plan"
                              data={verifiedPlatformPayments}
                              field="planDetails"
                              selectedValues={platformColumnFilters.plan || []}
                              onFilterChange={setPlatformColFilter('plan')}
                            />
                          </div>
                        </th>
                      )}
                      {platformCols.visible.has('date') && (
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                      )}
                      {platformCols.visible.has('status') && (
                        <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {processedPlatformPayments.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                          <div className="text-gray-500">
                            <p className="text-sm font-medium mb-1">No matching transactions</p>
                            <p className="text-xs">Try adjusting your search or sort criteria</p>
                          </div>
                        </td>
                      </tr>
                    ) : processedPlatformPayments.map((p) => {
                      const icon = p.paymentType === 'subscription'
                        ? <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100"><svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg></span>
                        : <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-100"><svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>;

                      return (
                        <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                          {platformCols.visible.has('type') && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                {icon}
                                <span className="text-sm font-medium text-gray-900">{p.typeLabel}</span>
                              </div>
                            </td>
                          )}
                          {platformCols.visible.has('amount') && (
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="text-sm font-bold text-gray-900">₹{(p.amount / 100).toLocaleString()}</span>
                            </td>
                          )}
                          {platformCols.visible.has('plan') && (
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {p.planDetails}
                              </span>
                            </td>
                          )}
                          {platformCols.visible.has('date') && (
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                              {new Date(p.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric', month: 'short', day: 'numeric'
                              })}
                            </td>
                          )}
                          {platformCols.visible.has('status') && (
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"></span>
                                Completed
                              </span>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
      )}

    </DashboardPage>
  );
};

export default FreelancerPayments;

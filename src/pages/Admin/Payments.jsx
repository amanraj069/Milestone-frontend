import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import SmartFilter from '../../components/SmartFilter';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';
import { graphqlQuery } from '../../utils/graphqlClient';

const COLUMNS = [
  { key: 'job',        label: 'Job',        defaultVisible: true },
  { key: 'milestone',  label: 'Milestone',  defaultVisible: true },
  { key: 'employer',   label: 'Employer',   defaultVisible: true },
  { key: 'freelancer', label: 'Freelancer', defaultVisible: true },
  { key: 'amount',     label: 'Amount',     defaultVisible: true },
  { key: 'status',     label: 'Status',     defaultVisible: true },
  { key: 'date',       label: 'Date',       defaultVisible: true },
];

const SORT_OPTIONS = [
  { value: 'date-desc',   label: 'Date: Newest First' },
  { value: 'date-asc',    label: 'Date: Oldest First' },
  { value: 'amount-desc', label: 'Amount: Highest First' },
  { value: 'amount-asc',  label: 'Amount: Lowest First' },
  { value: 'job-asc',     label: 'Job: A → Z' },
  { value: 'job-desc',    label: 'Job: Z → A' },
];

const ADMIN_PAYMENTS_QUERY = `
  query AdminPayments(
    $first: Int!
    $after: String
    $search: String
    $jobTitleIn: [String!]
    $milestoneIn: [String!]
    $employerIn: [String!]
    $freelancerIn: [String!]
    $statusIn: [String!]
    $sortBy: String
    $sortOrder: String
  ) {
    adminPayments(
      first: $first
      after: $after
      search: $search
      jobTitleIn: $jobTitleIn
      milestoneIn: $milestoneIn
      employerIn: $employerIn
      freelancerIn: $freelancerIn
      statusIn: $statusIn
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      edges {
        cursor
        node { jobId jobTitle milestoneId milestoneDescription amount status employerName companyName freelancerName date }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      total
      summary {
        totalTransactions
        paidTotal
        pendingTotal
        inProgressTotal
        paidCount
        pendingCount
        inProgressCount
      }
    }
    adminPaymentsMeta {
      summary {
        totalTransactions
        paidTotal
        pendingTotal
        inProgressTotal
        paidCount
        pendingCount
        inProgressCount
      }
      filterOptions {
        jobs
        milestones
        employers
        freelancers
        statuses
      }
    }
  }
`;

const AdminPayments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [payments, setPayments] = useState([]);
  const [totalPayments, setTotalPayments] = useState(0);
  const [metaSummary, setMetaSummary] = useState(null);
  const [metaFilters, setMetaFilters] = useState({ jobs: [], milestones: [], employers: [], freelancers: [], statuses: [] });
  const [summaryTotals, setSummaryTotals] = useState({
    totalTransactions: 0,
    paidTotal: 0,
    pendingTotal: 0,
    inProgressTotal: 0,
    paidCount: 0,
    pendingCount: 0,
    inProgressCount: 0,
  });
  const [serverPagination, setServerPagination] = useState(null);
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
  const [sortKey, setSortKey] = useState('date-desc');
  const { visible, setVisible } = useSmartColumnToggle(COLUMNS, 'admin-payments-columns');

  // Per-column SmartFilter state
  const [jobFilters,        setJobFilters]        = useState([]);
  const [milestoneFilters,  setMilestoneFilters]  = useState([]);
  const [employerFilters,   setEmployerFilters]   = useState([]);
  const [freelancerFilters, setFreelancerFilters] = useState([]);
  const [statusFilters,     setStatusFilters]     = useState([]);

  const [sortField, sortDir] = sortKey.split('-');
  const mappedSortBy =
    sortField === 'date'
      ? 'date'
      : sortField === 'amount'
        ? 'amount'
        : 'jobTitle';

  const filterSignature = JSON.stringify({
    searchTerm,
    sortBy: mappedSortBy,
    sortOrder: sortDir,
    jobFilters,
    milestoneFilters,
    employerFilters,
    freelancerFilters,
    statusFilters,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      resetAndFetchPayments();
    }, 250);

    return () => clearTimeout(timer);
  }, [pageSize, filterSignature]);

  useEffect(() => {
    const urlLimit = Number(searchParams.get('limit') || '25');
    if (Number.isFinite(urlLimit) && urlLimit > 0 && urlLimit !== pageSize) {
      setPageSize(Math.min(100, urlLimit));
    }
  }, [searchParams]);

  const fetchPayments = async ({ after = afterCursor } = {}) => {
    setLoading(true);
    try {
      const result = await graphqlQuery(ADMIN_PAYMENTS_QUERY, {
        first: pageSize,
        after,
        search: searchTerm.trim() || null,
        jobTitleIn: jobFilters.length ? jobFilters : null,
        milestoneIn: milestoneFilters.length ? milestoneFilters : null,
        employerIn: employerFilters.length ? employerFilters : null,
        freelancerIn: freelancerFilters.length ? freelancerFilters : null,
        statusIn: statusFilters.length ? statusFilters : null,
        sortBy: mappedSortBy,
        sortOrder: sortDir,
      });
      const connection = result?.adminPayments;
      const edges = connection?.edges || [];

      setPayments(edges.map((edge) => edge.node));
      setTotalPayments(connection?.total || 0);
      setMetaSummary(result?.adminPaymentsMeta?.summary || null);
      setMetaFilters(result?.adminPaymentsMeta?.filterOptions || { jobs: [], milestones: [], employers: [], freelancers: [], statuses: [] });
      setSummaryTotals({
        totalTransactions: connection?.summary?.totalTransactions || 0,
        paidTotal: connection?.summary?.paidTotal || 0,
        pendingTotal: connection?.summary?.pendingTotal || 0,
        inProgressTotal: connection?.summary?.inProgressTotal || 0,
        paidCount: connection?.summary?.paidCount || 0,
        pendingCount: connection?.summary?.pendingCount || 0,
        inProgressCount: connection?.summary?.inProgressCount || 0,
      });
      setServerPagination({
        hasNextPage: connection?.pageInfo?.hasNextPage || false,
        endCursor: connection?.pageInfo?.endCursor || null,
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetAndFetchPayments = async () => {
    setCurrentPage(1);
    setAfterCursor(null);
    setCursorStack([]);
    await fetchPayments({ after: null });
  };

  const handleNextPage = async () => {
    if (!serverPagination?.hasNextPage || !serverPagination?.endCursor) return;
    const nextAfter = serverPagination.endCursor;
    setCursorStack((prev) => [...prev, afterCursor]);
    setAfterCursor(nextAfter);
    setCurrentPage((p) => p + 1);
    await fetchPayments({ after: nextAfter });
  };

  const handlePrevPage = async () => {
    if (currentPage <= 1) return;
    const nextStack = [...cursorStack];
    const prevAfter = nextStack.pop() ?? null;
    setCursorStack(nextStack);
    setAfterCursor(prevAfter);
    setCurrentPage((p) => Math.max(1, p - 1));
    await fetchPayments({ after: prevAfter });
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

  const formatCurrency = (val) => `₹${(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const hasActiveFilters =
    jobFilters.length || milestoneFilters.length || employerFilters.length ||
    freelancerFilters.length || statusFilters.length;

  const clearAllFilters = () => {
    setJobFilters([]);
    setMilestoneFilters([]);
    setEmployerFilters([]);
    setFreelancerFilters([]);
    setStatusFilters([]);
  };

  const displayedPayments = payments;

  const totalPaid = metaSummary?.paidTotal ?? summaryTotals.paidTotal ?? 0;
  const totalPending = metaSummary?.pendingTotal ?? summaryTotals.pendingTotal ?? 0;
  const totalInProgress = metaSummary?.inProgressTotal ?? summaryTotals.inProgressTotal ?? 0;

  const pageAmountTotal = displayedPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const pagePaidCount = displayedPayments.filter((p) => p.status === 'Paid').length;
  const pagePendingCount = displayedPayments.filter((p) => p.status === 'Pending').length;
  const pageInProgressCount = displayedPayments.filter((p) => p.status === 'In Progress').length;

  return (
    <DashboardPage title="All Payments">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Transactions', value: metaSummary?.totalTransactions ?? totalPayments ?? payments.length, iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
          { label: 'Paid',              value: formatCurrency(totalPaid), iconBg: 'bg-green-100',  iconColor: 'text-green-600',  icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /> },
          { label: 'Pending',           value: formatCurrency(totalPending), iconBg: 'bg-orange-100', iconColor: 'text-orange-600', icon: <><circle cx="12" cy="12" r="10" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6l4 2" /></> },
          { label: 'In Progress',       value: formatCurrency(totalInProgress), iconBg: 'bg-blue-100', iconColor: 'text-blue-500', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /> },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
              <svg className={`w-5 h-5 ${s.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">{s.icon}</svg>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by job, employer, freelancer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <SmartColumnToggle
            columns={COLUMNS}
            visible={visible}
            onChange={setVisible}
            storageKey="admin-payments-columns"
            label="Columns"
          />
          {hasActiveFilters > 0 && (
            <button
              onClick={clearAllFilters}
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

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-[calc(90vh-20rem)] flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full">
            {!loading && (
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  {visible.has('job') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Job
                        <SmartFilter
                          label="Job"
                          data={payments}
                          field="jobTitle"
                          selectedValues={jobFilters}
                          onFilterChange={setJobFilters}
                          options={metaFilters?.jobs || []}
                        />
                      </div>
                    </th>
                  )}
                  {visible.has('milestone') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Milestone
                        <SmartFilter
                          label="Milestone"
                          data={payments}
                          field="milestoneDescription"
                          selectedValues={milestoneFilters}
                          onFilterChange={setMilestoneFilters}
                          options={metaFilters?.milestones || []}
                        />
                      </div>
                    </th>
                  )}
                  {visible.has('employer') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Employer
                        <SmartFilter
                          label="Employer"
                          data={payments}
                          field="employerName"
                          selectedValues={employerFilters}
                          onFilterChange={setEmployerFilters}
                          options={metaFilters?.employers || []}
                        />
                      </div>
                    </th>
                  )}
                  {visible.has('freelancer') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Freelancer
                        <SmartFilter
                          label="Freelancer"
                          data={payments}
                          field="freelancerName"
                          selectedValues={freelancerFilters}
                          onFilterChange={setFreelancerFilters}
                          options={metaFilters?.freelancers || []}
                        />
                      </div>
                    </th>
                  )}
                  {visible.has('amount') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  )}
                  {visible.has('status') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Status
                        <SmartFilter
                          label="Status"
                          data={payments}
                          field="status"
                          selectedValues={statusFilters}
                          onFilterChange={setStatusFilters}
                          options={metaFilters?.statuses || []}
                        />
                      </div>
                    </th>
                  )}
                  {visible.has('date') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
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
                      <span>Loading payments...</span>
                    </div>
                  </td>
                </tr>
              ) : displayedPayments.length > 0 ? (
                displayedPayments.map((payment, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    {visible.has('job') && (
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 text-sm truncate max-w-[180px]">{payment.jobTitle}</p>
                      </td>
                    )}
                    {visible.has('milestone') && (
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 truncate max-w-[150px]">{payment.milestoneDescription}</p>
                      </td>
                    )}
                    {visible.has('employer') && (
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{payment.employerName}</p>
                        <p className="text-xs text-gray-500">{payment.companyName}</p>
                      </td>
                    )}
                    {visible.has('freelancer') && (
                      <td className="px-4 py-3 text-sm text-gray-900">{payment.freelancerName}</td>
                    )}
                    {visible.has('amount') && (
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</td>
                    )}
                    {visible.has('status') && (
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'Paid' ? 'bg-green-100 text-green-700' :
                          payment.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    )}
                    {visible.has('date') && (
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={visible.size} className="px-4 py-12 text-center text-gray-400">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Table Summary Bar */}
        {!loading && displayedPayments.length > 0 && (
          <div className="px-6 py-3 bg-slate-50 border-t border-gray-200 text-xs font-medium text-gray-600">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <span className="text-gray-900 font-bold uppercase tracking-wider">Total Summary</span>
                <span>{displayedPayments.length} rows shown</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Paid: {pagePaidCount}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                  Pending: {pagePendingCount}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  In Progress: {pageInProgressCount}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded-md border border-gray-200">
                  Page Total: {formatCurrency(pageAmountTotal)}
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500">Page {currentPage}</span>
              </div>
            </div>
          </div>
        )}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500 mt-auto">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Showing {displayedPayments.length} payments on page {currentPage} (total {metaSummary?.totalTransactions ?? totalPayments ?? payments.length})
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
    </DashboardPage>
  );
};

export default AdminPayments;

import React, { useState, useEffect } from 'react';
import DashboardPage from '../../components/DashboardPage';
import SmartFilter from '../../components/SmartFilter';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

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

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
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

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/payments`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success) setPayments(data.payments);
        }
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

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

  const [sortField, sortDir] = sortKey.split('-');

  const filtered = payments
    .filter((p) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        p.jobTitle?.toLowerCase().includes(term) ||
        p.employerName?.toLowerCase().includes(term) ||
        p.freelancerName?.toLowerCase().includes(term) ||
        p.companyName?.toLowerCase().includes(term)
      );
    })
    .filter((p) => !jobFilters.length        || jobFilters.includes(p.jobTitle))
    .filter((p) => !milestoneFilters.length  || milestoneFilters.includes(p.milestoneDescription))
    .filter((p) => !employerFilters.length   || employerFilters.includes(p.employerName))
    .filter((p) => !freelancerFilters.length || freelancerFilters.includes(p.freelancerName))
    .filter((p) => !statusFilters.length     || statusFilters.includes(p.status))
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date')   cmp = new Date(a.date) - new Date(b.date);
      if (sortField === 'amount') cmp = (a.amount || 0) - (b.amount || 0);
      if (sortField === 'job')    cmp = (a.jobTitle || '').localeCompare(b.jobTitle || '');
      return sortDir === 'desc' ? -cmp : cmp;
    });

  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
  const totalInProgress = payments.filter(p => p.status === 'In Progress').reduce((s, p) => s + p.amount, 0);

  if (loading) {
    return (
      <DashboardPage title="All Payments">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading payments...</p>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="All Payments">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4 border-l-4 border-l-green-500">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4 border-l-4 border-l-yellow-500">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4 border-l-4 border-l-blue-500">
          <p className="text-xs font-medium text-gray-500 uppercase mb-1">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalInProgress)}</p>
        </div>
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
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
                      />
                    </div>
                  </th>
                )}
                {visible.has('date') && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((payment, i) => (
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
      </div>
    </DashboardPage>
  );
};

export default AdminPayments;

import React, { useState, useEffect } from 'react';
import DashboardPage from '../../components/DashboardPage';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

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

  const filtered = payments
    .filter((p) => {
      if (filter === 'paid') return p.status === 'Paid';
      if (filter === 'pending') return p.status === 'Pending';
      if (filter === 'in-progress') return p.status === 'In Progress';
      return true;
    })
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
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = new Date(a.date) - new Date(b.date);
      else if (sortBy === 'amount') cmp = a.amount - b.amount;
      else if (sortBy === 'job') cmp = (a.jobTitle || '').localeCompare(b.jobTitle || '');
      return sortOrder === 'desc' ? -cmp : cmp;
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
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
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="job">Sort by Job</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            <i className={`fas fa-sort-amount-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Job</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Milestone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Freelancer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length > 0 ? (
                filtered.map((payment, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm truncate max-w-[180px]">{payment.jobTitle}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-600 truncate max-w-[150px]">{payment.milestoneDescription}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-900">{payment.employerName}</p>
                      <p className="text-xs text-gray-500">{payment.companyName}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{payment.freelancerName}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'Paid' ? 'bg-green-100 text-green-700' :
                        payment.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-gray-400">
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

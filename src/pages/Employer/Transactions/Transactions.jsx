import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardPage from '../../../components/DashboardPage';
import SmartSearchInput from '../../../components/SmartSearchInput';
import SmartFilter from '../../../components/SmartFilter';
import SmartColumnToggle, { useSmartColumnToggle } from '../../../components/SmartColumnToggle';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const EmployerTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFeature, setSearchFeature] = useState('name');
  const [sortBy, setSortBy] = useState('name-a-z');
  const [nameFilters, setNameFilters] = useState([]);
  const [roleFilters, setRoleFilters] = useState([]);
  const [statusFilters, setStatusFilters] = useState([]);
  const [paymentProgressFilters, setPaymentProgressFilters] = useState([]);
  const navigate = useNavigate();

  const columns = [
    { key: 'freelancer', label: 'Freelancer', defaultVisible: true },
    { key: 'jobDetails', label: 'Job Details', defaultVisible: true },
    { key: 'status', label: 'Status', defaultVisible: true },
    { key: 'payment', label: 'Payment Progress', defaultVisible: true },
    { key: 'budget', label: 'Budget', defaultVisible: true },
    { key: 'action', label: 'Action', defaultVisible: true },
  ];

  const { visible: visibleColumns, setVisible: setVisibleColumns } = useSmartColumnToggle(columns, 'employer_transactions_columns');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/employer/transactions`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTransactions(data.data);
      } else {
        setError(data.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (jobId) => {
    navigate(`/employer/transactions/${jobId}`);
  };

  const getStatusBadge = (status) => {
    const config = {
      working: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'In Progress' },
      finished: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Completed' },
      left: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Left' }
    };
    const { bg, text, dot, label } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500', label: status };
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${bg} ${text}`}>
        <span className={`w-2 h-2 rounded-full ${dot} mr-2`}></span>
        {label}
      </span>
    );
  };

  const getPaymentProgressBucket = (percentage) => {
    if (percentage < 25) return 'Less than 25%';
    if (percentage < 50) return '25-50%';
    if (percentage < 75) return '50-75%';
    return '75-100%';
  };

  const getStatusLabel = (status) => {
    if (status === 'working') return 'In Progress';
    if (status === 'finished') return 'Completed';
    if (status === 'left') return 'Left';
    return status;
  };

  const paymentBucketSeed = [
    { __bucket: 'Less than 25%' },
    { __bucket: '25-50%' },
    { __bucket: '50-75%' },
    { __bucket: '75-100%' },
  ];

  const visibleTransactions = [...transactions]
    .filter((transaction) => {
      const searchLower = searchTerm.trim().toLowerCase();
      if (!searchLower) return true;

      const name = String(transaction.freelancerName || '').toLowerCase();
      const role = String(transaction.jobTitle || '').toLowerCase();

      if (searchFeature === 'name') return name.includes(searchLower);
      if (searchFeature === 'role') return role.includes(searchLower);

      return name.includes(searchLower) || role.includes(searchLower);
    })
    .filter((transaction) => {
      if (nameFilters.length > 0 && !nameFilters.includes(transaction.freelancerName)) return false;
      if (roleFilters.length > 0 && !roleFilters.includes(transaction.jobTitle)) return false;
      if (statusFilters.length > 0 && !statusFilters.includes(transaction.status)) return false;

      if (
        paymentProgressFilters.length > 0 &&
        !paymentProgressFilters.includes(getPaymentProgressBucket(transaction.paymentPercentage || 0))
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-a-z':
          return String(a.freelancerName || '').localeCompare(String(b.freelancerName || ''));
        case 'name-z-a':
          return String(b.freelancerName || '').localeCompare(String(a.freelancerName || ''));
        case 'budget-high-low':
          return (b.totalBudget || 0) - (a.totalBudget || 0);
        case 'budget-low-high':
          return (a.totalBudget || 0) - (b.totalBudget || 0);
        default:
          return 0;
      }
    });

  // Calculate summary stats
  const totalBudget = transactions.reduce((sum, t) => sum + t.totalBudget, 0);
  const totalPaid = transactions.reduce((sum, t) => sum + t.paidAmount, 0);
  const activeProjects = transactions.filter(t => t.status === 'working').length;
  const completedProjects = transactions.filter(t => t.status === 'finished').length;

  if (loading) {
    return (
      <DashboardPage title="Transactions">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-500">Loading transactions...</p>
          </div>
        </div>
      </DashboardPage>
    );
  }

  if (error) {
    return (
      <DashboardPage title="Transactions">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Transactions</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <button 
              onClick={fetchTransactions}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage title="Transactions">
      <p className="text-gray-500 mb-8 -mt-4">Manage payments and track project milestones with your freelancers</p>

      {/* Stats Cards */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalPaid.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{activeProjects}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedProjects}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-5 mb-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="flex-1 min-w-0">
              <SmartSearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                selectedFeature={searchFeature}
                onFeatureChange={setSearchFeature}
                dataSource={transactions}
                searchFields={[
                  { key: 'name', label: 'Name', getValue: (item) => item.freelancerName || '' },
                  { key: 'role', label: 'Role', getValue: (item) => item.jobTitle || '' },
                ]}
                placeholder="Search transactions..."
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 px-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Sort transactions"
              >
                <option value="name-a-z">Name A-Z</option>
                <option value="name-z-a">Name Z-A</option>
                <option value="budget-high-low">Budget High-Low</option>
                <option value="budget-low-high">Budget Low-High</option>
              </select>

              <SmartColumnToggle
                columns={columns}
                visible={visibleColumns}
                onChange={setVisibleColumns}
                storageKey="employer_transactions_columns"
                label="Columns"
                heading="Table Columns"
                triggerClassName="text-gray-700 bg-white border-gray-200 hover:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {transactions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
              <p className="text-gray-500 max-w-md mx-auto">Once you hire freelancers for your jobs, their payment details will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
                    {visibleColumns.has('freelancer') && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          Freelancer
                          <SmartFilter
                            label="Freelancer"
                            data={transactions}
                            field="freelancerName"
                            selectedValues={nameFilters}
                            onFilterChange={setNameFilters}
                          />
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('jobDetails') && (
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          Job Details
                          <SmartFilter
                            label="Job role"
                            data={transactions}
                            field="jobTitle"
                            selectedValues={roleFilters}
                            onFilterChange={setRoleFilters}
                          />
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('status') && (
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-2">
                          Status
                          <SmartFilter
                            label="Status"
                            data={transactions}
                            field="status"
                            selectedValues={statusFilters}
                            onFilterChange={setStatusFilters}
                            valueFormatter={getStatusLabel}
                          />
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('payment') && (
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        <div className="flex items-center justify-center gap-2">
                          Payment Progress
                          <SmartFilter
                            label="Payment"
                            data={[...transactions, ...paymentBucketSeed]}
                            selectedValues={paymentProgressFilters}
                            onFilterChange={setPaymentProgressFilters}
                            valueExtractor={(item) => item.__bucket || getPaymentProgressBucket(item.paymentPercentage || 0)}
                          />
                        </div>
                      </th>
                    )}
                    {visibleColumns.has('budget') && (
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Budget</th>
                    )}
                    {visibleColumns.has('action') && (
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {visibleTransactions.map((transaction) => (
                      <tr 
                        key={transaction.jobId} 
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {visibleColumns.has('freelancer') && (
                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                {transaction.freelancerPicture ? (
                                  <img 
                                    className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md" 
                                    src={transaction.freelancerPicture} 
                                    alt={transaction.freelancerName} 
                                  />
                                ) : (
                                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                                    {transaction.freelancerName?.charAt(0)?.toUpperCase() || 'F'}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {transaction.freelancerName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {transaction.freelancerEmail}
                                </div>
                              </div>
                            </div>
                          </td>
                        )}

                        {visibleColumns.has('jobDetails') && (
                          <td className="px-6 py-5">
                            <div className="text-sm font-semibold text-gray-900 mb-1">{transaction.jobTitle}</div>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                              </svg>
                              {transaction.completedMilestones}/{transaction.milestonesCount} milestones
                            </div>
                          </td>
                        )}

                        {visibleColumns.has('status') && (
                          <td className="px-6 py-5 text-center">
                            {getStatusBadge(transaction.status)}
                          </td>
                        )}

                        {visibleColumns.has('payment') && (
                          <td className="px-6 py-5">
                            <div className="flex flex-col items-center">
                              <div className="w-full max-w-[120px] bg-gray-100 rounded-full h-2.5 mb-2">
                                <div 
                                  className={`h-2.5 rounded-full transition-all duration-500 ${
                                    transaction.paymentPercentage === 100 
                                      ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                      : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                                  }`}
                                  style={{ width: `${transaction.paymentPercentage}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-gray-700">{transaction.paymentPercentage}%</span>
                            </div>
                          </td>
                        )}

                        {visibleColumns.has('budget') && (
                          <td className="px-6 py-5 text-center">
                            <div className="text-sm font-bold text-gray-900">₹{transaction.totalBudget.toLocaleString()}</div>
                            <div className="text-xs text-green-600 font-medium">
                              ₹{transaction.paidAmount.toLocaleString()} paid
                            </div>
                          </td>
                        )}

                        {visibleColumns.has('action') && (
                          <td className="px-6 py-5 text-center">
                            <button
                              onClick={() => handleViewDetails(transaction.jobId)}
                              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Details
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {transactions.length > 0 && visibleTransactions.length === 0 && (
            <div className="text-center py-16 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matching Transactions</h3>
              <p className="text-gray-500">Try changing search text, filters, or sort selection.</p>
            </div>
          )}
        </div>
    </DashboardPage>
  );
};

export default EmployerTransactions;

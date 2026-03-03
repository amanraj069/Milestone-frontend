import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';
import DashboardPage from '../../components/DashboardPage';
import SmartFilter from '../../components/SmartFilter';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';

// Modal animation styles
const modalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
  .animate-slideUp { animation: slideUp 0.3s ease-out; }
`;

const ModeratorApprovals = () => {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved'
  const [processing, setProcessing] = useState(null);
  
  // SmartFilter states
  const [nameFilters, setNameFilters] = useState([]);
  const [emailFilters, setEmailFilters] = useState([]);
  const [companyFilters, setCompanyFilters] = useState([]);
  const [locationFilters, setLocationFilters] = useState([]);
  const [statusFiltersColumn, setStatusFiltersColumn] = useState([]);
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState({ show: false, userId: null, name: '', action: '' });
  const [detailsModal, setDetailsModal] = useState({ show: false, employer: null });
  const [sortBy, setSortBy] = useState('recent');

  const allColumns = [
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company' },
    { key: 'location', label: 'Location' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status' },
    { key: 'registered', label: 'Registered' },
    { key: 'actions', label: 'Actions' },
  ];

  const { visible: visibleColumns, setVisible: setVisibleColumns } = useSmartColumnToggle(allColumns, 'moderator-approvals-visible-columns');
  const isColumnVisible = (k) => visibleColumns.has(k);

  useEffect(() => {
    fetchEmployers();
  }, [statusFilter]);

  const fetchEmployers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/moderator/approvals/pending`,
        { 
          params: { status: statusFilter === 'all' ? 'all' : statusFilter },
          withCredentials: true 
        }
      );

      if (response.data.success) {
        setEmployers(response.data.pendingApprovals || []);
      }
    } catch (error) {
      console.error('Error fetching employers:', error);
      setError('Failed to load employers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    setProcessing(userId);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/moderator/approvals/${userId}/approve`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        // Refresh the list
        fetchEmployers();
        setConfirmModal({ show: false, userId: null, name: '', action: '' });
      }
    } catch (error) {
      console.error('Error approving employer:', error);
      alert('Failed to approve employer. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId) => {
    setProcessing(userId);
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/moderator/approvals/${userId}/reject`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        // Refresh the list
        fetchEmployers();
        setConfirmModal({ show: false, userId: null, name: '', action: '' });
      }
    } catch (error) {
      console.error('Error rejecting employer:', error);
      alert('Failed to reject employer. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setNameFilters([]);
    setEmailFilters([]);
    setCompanyFilters([]);
    setLocationFilters([]);
    setStatusFiltersColumn([]);
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' ||
    nameFilters.length > 0 || emailFilters.length > 0 || companyFilters.length > 0 ||
    locationFilters.length > 0 || statusFiltersColumn.length > 0;

  // Filter employers
  let filteredEmployers = employers.filter(employer => {
    // Top Status Filter (all, pending, approved, rejected)
    if (statusFilter === 'pending') {
      if (employer.approvalStatus !== 'Pending') return false;
    } else if (statusFilter === 'approved') {
      if (employer.approvalStatus !== 'Approved') return false;
    } else if (statusFilter === 'rejected') {
      if (employer.approvalStatus !== 'Rejected') return false;
    }

    // Column filters (SmartFilter)
    if (nameFilters.length > 0 && !nameFilters.includes(employer.name || '')) {
      return false;
    }
    if (emailFilters.length > 0 && !emailFilters.includes(employer.email || '')) {
      return false;
    }
    if (companyFilters.length > 0 && !companyFilters.includes(employer.companyName || '')) {
      return false;
    }
    if (locationFilters.length > 0 && !locationFilters.includes(employer.location || '')) {
      return false;
    }
    if (statusFiltersColumn.length > 0 && !statusFiltersColumn.includes(employer.approvalStatus || '')) {
      return false;
    }
    
    // Search filter (regex)
    if (searchTerm.trim() === '') {
      return true;
    }

    try {
      const regex = new RegExp(searchTerm, 'i');
      return (
        regex.test(employer.name || '') ||
        regex.test(employer.email || '') ||
        regex.test(employer.companyName || '') ||
        regex.test(employer.location || '')
      );
    } catch (e) {
      // Invalid regex, fall back to includes
      const searchLower = searchTerm.toLowerCase();
      return (
        (employer.name || '').toLowerCase().includes(searchLower) ||
        (employer.email || '').toLowerCase().includes(searchLower) ||
        (employer.companyName || '').toLowerCase().includes(searchLower) ||
        (employer.location || '').toLowerCase().includes(searchLower)
      );
    }
  });

  const totalEmployers = employers.length;
  const pendingCount = employers.filter(e => !e.isApproved && !e.isRejected).length;
  const approvedCount = employers.filter(e => e.isApproved).length;
  const rejectedCount = employers.filter(e => e.isRejected).length;

  const content = (
    <div className="space-y-6">
      {/* Inject modal animation styles */}
      <style>{modalStyles}</style>
      
      {/* Page Subtitle */}
      <p className="text-gray-500 -mt-6">Review and approve employer registrations</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-users text-blue-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Employers</p>
              <p className="text-2xl font-bold text-gray-800">{totalEmployers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-hourglass-half text-yellow-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-800">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-check-circle text-purple-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Approved</p>
              <p className="text-2xl font-bold text-gray-800">{approvedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-times-circle text-emerald-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Rejected</p>
              <p className="text-2xl font-bold text-gray-800">{rejectedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        {/* Top Status Filter (kept) */}
        <div className="flex flex-wrap items-center gap-4">
        </div>

        {/* Search Row with Sort and Column Toggle */}
        <div className="relative flex items-center gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search employers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500">Sort By</div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="recent">Recently Registered</option>
              <option value="oldest">Oldest Registered</option>
              <option value="name-az">Name A - Z</option>
              <option value="name-za">Name Z - A</option>
            </select>

            <SmartColumnToggle
              columns={allColumns}
              visible={visibleColumns}
              onChange={setVisibleColumns}
              storageKey="moderator-approvals-visible-columns"
            />

            <button
              onClick={clearAllFilters}
              disabled={!hasActiveFilters}
              className={`px-3 py-2 ml-2 rounded-md text-sm font-medium border ${hasActiveFilters ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'}`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Loading / Error States */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading employers...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-red-600 mb-2">Error loading employers</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={fetchEmployers} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">Retry</button>
        </div>
      )}

      {/* Employers Table Container */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  {isColumnVisible('name') && (
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-2">
                        Name
                        <SmartFilter
                          label="Name"
                          data={employers}
                          field="name"
                          selectedValues={nameFilters}
                          onFilterChange={setNameFilters}
                        />
                      </div>
                    </th>
                  )}

                  {isColumnVisible('company') && (
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-2">
                        Company
                        <SmartFilter
                          label="Company"
                          data={employers}
                          field="companyName"
                          selectedValues={companyFilters}
                          onFilterChange={setCompanyFilters}
                        />
                      </div>
                    </th>
                  )}

                  {isColumnVisible('location') && (
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-2">
                        Location
                        <SmartFilter
                          label="Location"
                          data={employers}
                          field="location"
                          selectedValues={locationFilters}
                          onFilterChange={setLocationFilters}
                        />
                      </div>
                    </th>
                  )}

                  {isColumnVisible('phone') && (
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                  )}

                  {isColumnVisible('status') && (
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center gap-2">
                        Status
                        <SmartFilter
                          label="Status"
                          data={employers}
                          field="approvalStatus"
                          selectedValues={statusFiltersColumn}
                          onFilterChange={setStatusFiltersColumn}
                        />
                      </div>
                    </th>
                  )}

                  {isColumnVisible('registered') && (
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Registered</th>
                  )}

                  {isColumnVisible('actions') && (
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployers.length > 0 ? (
                  filteredEmployers.map((employer) => (
                    <tr key={employer.userId} className="hover:bg-gray-50">
                      {isColumnVisible('name') && (
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={employer.picture || 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'}
                              alt={employer.name}
                              className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                              onError={(e) => { e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png'; }}
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate max-w-[200px]">{employer.name}</div>
                              <div className="text-xs text-gray-500 truncate max-w-[200px]">{employer.email}</div>
                            </div>
                          </div>
                        </td>
                      )}

                      {isColumnVisible('company') && (
                        <td className="px-4 py-3 text-gray-600 truncate max-w-[180px]">{employer.companyName || 'N/A'}</td>
                      )}

                      {isColumnVisible('location') && (
                        <td className="px-4 py-3 text-gray-600 truncate max-w-[150px]">{employer.location || 'N/A'}</td>
                      )}

                      {isColumnVisible('phone') && (
                        <td className="px-4 py-3 text-gray-600 text-sm whitespace-nowrap">{employer.phone || 'N/A'}</td>
                      )}

                      {isColumnVisible('status') && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            employer.approvalStatus === 'Approved' ? 'bg-green-100 text-green-700' : 
                            employer.approvalStatus === 'Rejected' ? 'bg-red-100 text-red-700' : 
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {employer.approvalStatus}
                          </span>
                        </td>
                      )}

                      {isColumnVisible('registered') && (
                        <td className="px-4 py-3 text-gray-600 text-sm whitespace-nowrap">
                          {new Date(employer.registeredAt || Date.now()).toLocaleDateString()}
                        </td>
                      )}

                      {isColumnVisible('actions') && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button 
                              onClick={() => setDetailsModal({ show: true, employer })}
                              className="bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded text-xs transition-colors border border-gray-200 shadow-sm"
                            >
                              Details
                            </button>

                            {employer.approvalStatus === 'Pending' && (
                              <>
                                <button
                                  onClick={() => setConfirmModal({ show: true, userId: employer.userId, name: employer.name, action: 'approve' })}
                                  disabled={processing === employer.userId}
                                  className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setConfirmModal({ show: true, userId: employer.userId, name: employer.name, action: 'reject' })}
                                  disabled={processing === employer.userId}
                                  className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            {employer.approvalStatus === 'Approved' && (
                              <span className="text-xs text-gray-400 italic font-medium px-2 pt-2">No further actions</span>
                            )}
                            {employer.approvalStatus === 'Rejected' && (
                              <button 
                                onClick={() => setConfirmModal({ show: true, userId: employer.userId, name: employer.name, action: 'approve' })}
                                disabled={processing === employer.userId}
                                className="bg-green-50 text-green-600 hover:bg-green-100 px-3 py-1.5 rounded text-xs transition-colors border border-green-200 font-semibold"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-20 text-center">
                      <div className="max-w-xs mx-auto">
                        <div className="w-12 h-12 mx-auto mb-3 bg-gray-50 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-medium text-sm">No Matching Results</p>
                        <p className="text-gray-400 text-xs mt-1">Try adjusting your filters or search terms.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Showing count moved to table footer */}
          <div className="px-4 py-3 text-sm text-gray-600">Showing: {filteredEmployers.length} of {totalEmployers}</div>
        </div>
      )}

      {/* Details Modal */}
      {detailsModal.show && detailsModal.employer && (
        <div
          className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setDetailsModal({ show: false, employer: null })}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Employer Details</h3>
              <button
                onClick={() => setDetailsModal({ show: false, employer: null })}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{detailsModal.employer.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{detailsModal.employer.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{detailsModal.employer.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Location</p>
                <p className="font-medium text-gray-900">{detailsModal.employer.location || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Approval Status</p>
                <p className="font-medium text-gray-900">{detailsModal.employer.approvalStatus || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500">Registered</p>
                <p className="font-medium text-gray-900">{new Date(detailsModal.employer.registeredAt || Date.now()).toLocaleString()}</p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-base font-semibold text-gray-900">Company Verification Data</h4>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${detailsModal.employer.companyDetails?.isSubmitted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {detailsModal.employer.companyDetails?.isSubmitted ? 'Submitted' : 'Not Submitted'}
                </span>
              </div>

              {detailsModal.employer.companyDetails?.isSubmitted ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Company Name</p>
                    <p className="font-medium text-gray-900">{detailsModal.employer.companyDetails?.companyName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Company PAN</p>
                    <p className="font-medium text-gray-900">{detailsModal.employer.companyDetails?.companyPAN || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Accounts Payable Contact Email</p>
                    <p className="font-medium text-gray-900">{detailsModal.employer.companyDetails?.accountsPayableEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Official Business Email</p>
                    <p className="font-medium text-gray-900">{detailsModal.employer.companyDetails?.officialBusinessEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tax Identification Number (TIN / VAT / GST)</p>
                    <p className="font-medium text-gray-900">{detailsModal.employer.companyDetails?.taxIdentificationNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Submitted At</p>
                    <p className="font-medium text-gray-900">
                      {detailsModal.employer.companyDetails?.submittedAt
                        ? new Date(detailsModal.employer.companyDetails.submittedAt).toLocaleString()
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-gray-500">Billing Address</p>
                    <p className="font-medium text-gray-900 whitespace-pre-wrap">{detailsModal.employer.companyDetails?.billingAddress || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Proof of Address</p>
                    {detailsModal.employer.companyDetails?.proofOfAddressUrl ? (
                      <a
                        href={(detailsModal.employer.companyDetails.proofOfAddressUrl || '').startsWith('/') ? `${API_BASE_URL}${detailsModal.employer.companyDetails.proofOfAddressUrl}` : detailsModal.employer.companyDetails.proofOfAddressUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View Document
                      </a>
                    ) : (
                      <p className="font-medium text-gray-900">N/A</p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500">Company Logo</p>
                    {detailsModal.employer.companyDetails?.companyLogoUrl ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={(detailsModal.employer.companyDetails.companyLogoUrl || '').startsWith('/') ? `${API_BASE_URL}${detailsModal.employer.companyDetails.companyLogoUrl}` : detailsModal.employer.companyDetails.companyLogoUrl}
                          alt="Company Logo"
                          className="w-28 h-16 object-contain border border-gray-200 rounded bg-white"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <a
                          href={(detailsModal.employer.companyDetails.companyLogoUrl || '').startsWith('/') ? `${API_BASE_URL}${detailsModal.employer.companyDetails.companyLogoUrl}` : detailsModal.employer.companyDetails.companyLogoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Open full image
                        </a>
                      </div>
                    ) : (
                      <p className="font-medium text-gray-900">N/A</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Company verification details have not been submitted yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div
          className="fixed inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setConfirmModal({ show: false, userId: null, name: '', action: '' })}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
              confirmModal.action === 'approve' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {confirmModal.action === 'approve' ? (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              {confirmModal.action === 'approve' ? 'Approve Employer?' : 'Reject Employer?'}
            </h3>
            <p className="text-gray-500 text-center mb-6">
              {confirmModal.action === 'approve' 
                ? `Are you sure you want to approve ${confirmModal.name}? They will be able to access the platform and post job listings.`
                : confirmModal.action === 'reject' 
                  ? `Are you sure you want to reject ${confirmModal.name}? Their status will be set to Rejected and they will lose access.`
                  : `Are you sure you want to perform this action for ${confirmModal.name}?`
              }
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ show: false, userId: null, name: '', action: '' })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmModal.action === 'approve' 
                  ? handleApprove(confirmModal.userId) 
                  : handleReject(confirmModal.userId)
                }
                disabled={processing === confirmModal.userId}
                className={`flex-1 px-4 py-2 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${
                  confirmModal.action === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {processing === confirmModal.userId 
                  ? 'Processing...' 
                  : confirmModal.action === 'approve' ? 'Approve' : 'Reject'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DashboardPage title="Approvals">
      {content}
    </DashboardPage>
  );
};

export default ModeratorApprovals;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardPage from '../../components/DashboardPage';
import SmartFilter from '../../components/SmartFilter';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Employers</p>
          <p className="text-2xl font-semibold text-gray-900">{totalEmployers}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pending Approval</p>
          <p className="text-2xl font-semibold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approved</p>
          <p className="text-2xl font-semibold text-green-600">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rejected</p>
          <p className="text-2xl font-semibold text-red-600">{rejectedCount}</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {hasActiveFilters && (
            <div>
              <label className="block text-xs font-medium text-transparent mb-1">.</label>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            </div>
          )}

          <div className="ml-auto text-sm text-gray-500 whitespace-nowrap">
            Showing: {filteredEmployers.length} of {totalEmployers}
          </div>
        </div>

        {/* Search Row */}
        <div className="relative">
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
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
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
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Registered</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployers.length > 0 ? (
                  filteredEmployers.map((employer) => (
                    <tr key={employer.userId} className="hover:bg-gray-50">
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
                      <td className="px-4 py-3 text-gray-600 truncate max-w-[180px]">{employer.companyName || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600 truncate max-w-[150px]">{employer.location || 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm whitespace-nowrap">{employer.phone || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          employer.approvalStatus === 'Approved' ? 'bg-green-100 text-green-700' : 
                          employer.approvalStatus === 'Rejected' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {employer.approvalStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm whitespace-nowrap">
                        {new Date(employer.registeredAt || Date.now()).toLocaleDateString()}
                      </td>
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

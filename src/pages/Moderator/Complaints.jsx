import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchComplaints, 
  setSearchTerm, 
  setSortBy, 
  setSortOrder 
} from '../../redux/slices/complaintsSlice';
import DashboardPage from '../../components/DashboardPage';
import SmartFilter from '../../components/SmartFilter';
import SmartColumnToggle, { useSmartColumnToggle } from '../../components/SmartColumnToggle';

const COLUMNS = [
  { key: 'filedBy',   label: 'Filed By',  defaultVisible: true },
  { key: 'against',   label: 'Against',   defaultVisible: true },
  { key: 'job',       label: 'Job',       defaultVisible: true },
  { key: 'type',      label: 'Type',      defaultVisible: true },
  { key: 'priority',  label: 'Priority',  defaultVisible: true },
  { key: 'subject',   label: 'Subject',   defaultVisible: true },
  { key: 'status',    label: 'Status',    defaultVisible: true },
  { key: 'created',   label: 'Created',   defaultVisible: true },
  { key: 'action',    label: 'Action',    defaultVisible: true },
];

const ModeratorComplaints = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { 
    filteredComplaints, 
    searchTerm: reduxSearchTerm, 
    sortBy, 
    sortOrder, 
    stats, 
    complaints,
    total,
    pagination,
    filterOptions,
    loading, 
    error 
  } = useSelector(state => state.complaints);

  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Column visibility
  const { visible, setVisible } = useSmartColumnToggle(COLUMNS, 'moderator-complaints-columns');
  const isCol = (key) => visible.has(key);

  // SmartFilter states
  const [columnFilters, setColumnFilters] = useState({
    complainantType: [],
    against: [],
    job: [],
    status: [],
    priority: [],
    type: [],
  });
  const setColFilter = (field) => (values) => {
    setCurrentPage(1);
    setColumnFilters((prev) => ({ ...prev, [field]: values }));
  };

  const filterSignature = JSON.stringify({
    searchTerm: debouncedSearchTerm,
    sortBy,
    sortOrder,
    columnFilters,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm((reduxSearchTerm || '').trim());
    }, 250);

    return () => clearTimeout(timer);
  }, [reduxSearchTerm]);

  useEffect(() => {
    dispatch(
      fetchComplaints({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearchTerm,
        sortBy,
        sortOrder,
        complainantTypeIn: columnFilters.complainantType,
        againstIn: columnFilters.against,
        jobIn: columnFilters.job,
        statusIn: columnFilters.status,
        priorityIn: columnFilters.priority,
        typeIn: columnFilters.type,
      }),
    );
  }, [dispatch, currentPage, pageSize, filterSignature]);

  const handleViewComplaint = (complaintId) => {
    navigate(`/moderator/complaints/${complaintId}`);
  };

  const handleSearchChange = (value) => {
    setCurrentPage(1);
    dispatch(setSearchTerm(value));
  };

  const handleSortDropdownChange = (value) => {
    const [field, order] = value.split('_');
    setCurrentPage(1);
    dispatch(setSortBy(field));
    dispatch(setSortOrder(order));
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-100 text-amber-700';
      case 'Under Review': return 'bg-blue-100 text-blue-700';
      case 'Resolved': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Low': return 'bg-blue-100 text-blue-700';
      case 'Medium': return 'bg-amber-100 text-amber-700';
      case 'High': return 'bg-red-100 text-red-700';
      case 'Critical': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const displayedComplaints = filteredComplaints;

  return (
    <DashboardPage title="Complaints">
      <p className="text-gray-500 mt-1 mb-6">View and manage all registered complaints</p>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-exclamation-circle text-blue-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Complaints</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-hourglass-half text-yellow-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-search text-purple-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Under Review</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{stats.underReview}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-check-circle text-emerald-600 text-xl"></i>
            </div>
            <div>
              <p className="text-gray-600 text-sm mb-1">Resolved</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-800 leading-tight break-words">{stats.resolved}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Sort + Column Toggle */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by subject, name, type, or job..."
              value={reduxSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Sort By */}
          <select
            value={`${sortBy}_${sortOrder}`}
            onChange={(e) => handleSortDropdownChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="date_desc">Date (Newest First)</option>
            <option value="date_asc">Date (Oldest First)</option>
            <option value="priority_desc">Priority (High → Low)</option>
            <option value="priority_asc">Priority (Low → High)</option>
            <option value="status_asc">Status (A–Z)</option>
            <option value="status_desc">Status (Z–A)</option>
            <option value="complainant_asc">Complainant (A–Z)</option>
            <option value="complainant_desc">Complainant (Z–A)</option>
          </select>
          {/* Column Toggle */}
          <SmartColumnToggle
            columns={COLUMNS}
            visible={visible}
            onChange={setVisible}
            storageKey="moderator-complaints-columns"
            label="Columns"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 mb-3"></div>
          <p className="text-gray-500">Loading complaints...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-red-600 mb-2">Error loading complaints</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() =>
              dispatch(
                fetchComplaints({
                  page: currentPage,
                  limit: pageSize,
                  search: reduxSearchTerm,
                  sortBy,
                  sortOrder,
                  complainantTypeIn: columnFilters.complainantType,
                  againstIn: columnFilters.against,
                  jobIn: columnFilters.job,
                  statusIn: columnFilters.status,
                  priorityIn: columnFilters.priority,
                  typeIn: columnFilters.type,
                }),
              )
            } 
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Complaints Table — always shown so SmartFilter dropdowns remain accessible */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {isCol('filedBy') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Filed By
                        <SmartFilter
                          label="Complainant"
                          data={complaints}
                          field="complainantType"
                          selectedValues={columnFilters.complainantType}
                          onFilterChange={setColFilter('complainantType')}
                          options={filterOptions?.complainantTypes || []}
                        />
                      </div>
                    </th>
                  )}
                  {isCol('against') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Against
                        <SmartFilter
                          label="Against"
                          data={complaints}
                          field="against"
                          selectedValues={columnFilters.against}
                          onFilterChange={setColFilter('against')}
                          valueExtractor={(c) => c.complainantType === 'Freelancer' ? c.employerName : c.freelancerName}
                          options={filterOptions?.against || []}
                        />
                      </div>
                    </th>
                  )}
                  {isCol('job') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Job
                        <SmartFilter
                          label="Job"
                          data={complaints}
                          field="jobTitle"
                          selectedValues={columnFilters.job}
                          onFilterChange={setColFilter('job')}
                          options={filterOptions?.jobs || []}
                        />
                      </div>
                    </th>
                  )}
                  {isCol('type') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Type
                        <SmartFilter
                          label="Type"
                          data={complaints}
                          field="complaintType"
                          selectedValues={columnFilters.type}
                          onFilterChange={setColFilter('type')}
                          options={filterOptions?.types || []}
                        />
                      </div>
                    </th>
                  )}
                  {isCol('priority') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Priority
                        <SmartFilter
                          label="Priority"
                          data={complaints}
                          field="priority"
                          selectedValues={columnFilters.priority}
                          onFilterChange={setColFilter('priority')}
                          options={filterOptions?.priorities || []}
                        />
                      </div>
                    </th>
                  )}
                  {isCol('subject') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Subject</th>
                  )}
                  {isCol('status') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      <div className="flex items-center gap-1.5">
                        Status
                        <SmartFilter
                          label="Status"
                          data={complaints}
                          field="status"
                          selectedValues={columnFilters.status}
                          onFilterChange={setColFilter('status')}
                          options={filterOptions?.statuses || []}
                        />
                      </div>
                    </th>
                  )}
                  {isCol('created') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Created</th>
                  )}
                  {isCol('action') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {displayedComplaints.length > 0 ? (
                  displayedComplaints.map((complaint) => (
                  <tr key={complaint.complaintId} className="hover:bg-gray-50">
                    {isCol('filedBy') && (
                      <td className="px-4 py-3">
                        <div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium mb-1 ${
                            complaint.complainantType === 'Freelancer' 
                              ? 'bg-cyan-100 text-cyan-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {complaint.complainantType}
                          </span>
                          <p className="text-gray-900">{complaint.complainantName}</p>
                        </div>
                      </td>
                    )}
                    {isCol('against') && (
                      <td className="px-4 py-3 text-gray-600">
                        {complaint.complainantType === 'Freelancer' ? complaint.employerName : complaint.freelancerName}
                      </td>
                    )}
                    {isCol('job') && (
                      <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">{complaint.jobTitle}</td>
                    )}
                    {isCol('type') && (
                      <td className="px-4 py-3 text-gray-600">{complaint.complaintType}</td>
                    )}
                    {isCol('priority') && (
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadgeClass(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      </td>
                    )}
                    {isCol('subject') && (
                      <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{complaint.subject}</td>
                    )}
                    {isCol('status') && (
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </td>
                    )}
                    {isCol('created') && (
                      <td className="px-4 py-3 text-gray-600">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </td>
                    )}
                    {isCol('action') && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewComplaint(complaint.complaintId)}
                          className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    )}
                  </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={visible.size} className="px-4 py-12 text-center text-gray-400">
                      No complaints found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Showing x of x — under the table */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                Showing {displayedComplaints.length} complaints on page {currentPage} (total {total || stats.total || 0})
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Rows:</label>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setCurrentPage(1);
                    setPageSize(Math.min(100, Math.max(1, Number(e.target.value) || 25)));
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-md text-xs"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={loading || currentPage <= 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={loading || !pagination?.hasNextPage}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardPage>
  );
};

export default ModeratorComplaints;


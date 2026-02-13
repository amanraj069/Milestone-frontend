import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchComplaints, 
  setFilters, 
  setSearchTerm, 
  setSortBy, 
  toggleSortOrder 
} from '../../redux/slices/complaintsSlice';
import DashboardPage from '../../components/DashboardPage';

const ModeratorComplaints = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { 
    filteredComplaints, 
    filters, 
    searchTerm: reduxSearchTerm, 
    sortBy, 
    sortOrder, 
    stats, 
    loading, 
    error 
  } = useSelector(state => state.complaints);

  useEffect(() => {
    dispatch(fetchComplaints());
  }, [dispatch]);

  const handleViewComplaint = (complaintId) => {
    navigate(`/admin/complaints/${complaintId}`);
  };

  const handleFilterChange = (filterType, value) => {
    dispatch(setFilters({ [filterType]: value }));
  };

  const handleSearchChange = (value) => {
    dispatch(setSearchTerm(value));
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      dispatch(toggleSortOrder());
    } else {
      dispatch(setSortBy(field));
    }
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

  return (
    <DashboardPage title="Complaints">
      <p className="text-gray-500 -mt-6 mb-6">View and manage all registered complaints</p>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
          <p className="text-xs text-gray-500 mt-1">Total Complaints</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-amber-600">{stats.pending}</p>
          <p className="text-xs text-gray-500 mt-1">Pending</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-blue-600">{stats.underReview}</p>
          <p className="text-xs text-gray-500 mt-1">Under Review</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-green-600">{stats.resolved}</p>
          <p className="text-xs text-gray-500 mt-1">Resolved</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-2xl font-semibold text-red-600">{stats.rejected}</p>
          <p className="text-xs text-gray-500 mt-1">Rejected</p>
        </div>
      </div>

      {/* Search Bar and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by subject, name, type, or job..."
              value={reduxSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            Showing: {filteredComplaints.length} of {stats.total}
          </span>
        </div>
        
        {/* Filters and Sorting */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Complainant:</label>
            <select 
              value={filters.complainantType} 
              onChange={(e) => handleFilterChange('complainantType', e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            >
              <option value="All">All</option>
              <option value="Freelancer">Freelancer</option>
              <option value="Employer">Employer</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Under Review">Under Review</option>
              <option value="Resolved">Resolved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Priority:</label>
            <select 
              value={filters.priority} 
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            >
              <option value="All">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sort By:</label>
            <select 
              value={sortBy} 
              onChange={(e) => dispatch(setSortBy(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
            >
              <option value="date">Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="complainant">Complainant</option>
            </select>
          </div>
          <button 
            onClick={() => dispatch(toggleSortOrder())}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          </button>
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
            onClick={() => dispatch(fetchComplaints())} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* No Complaints State */}
      {!loading && !error && filteredComplaints.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-lg font-medium text-gray-700 mb-1">No complaints found</p>
          <p className="text-gray-500">There are no complaints matching your filters.</p>
        </div>
      )}

      {/* Complaints Table */}
      {!loading && !error && filteredComplaints.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('complainant')}
                  >
                    Filed By {sortBy === 'complainant' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Against</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('priority')}
                  >
                    Priority {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('status')}
                  >
                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('date')}
                  >
                    Created {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.complaintId} className="hover:bg-gray-50">
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
                    <td className="px-4 py-3 text-gray-600">
                      {complaint.complainantType === 'Freelancer' ? complaint.employerName : complaint.freelancerName}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">{complaint.jobTitle}</td>
                    <td className="px-4 py-3 text-gray-600">{complaint.complaintType}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadgeClass(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{complaint.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusBadgeClass(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(complaint.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleViewComplaint(complaint.complaintId)}
                        className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-gray-800 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardPage>
  );
};

export default ModeratorComplaints;


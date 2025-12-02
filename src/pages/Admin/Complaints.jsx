import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchComplaints, 
  setFilters, 
  setSearchTerm, 
  setSortBy, 
  toggleSortOrder 
} from '../../store/slices/complaintsSlice';
import DashboardPage from '../../components/DashboardPage';
import './Complaints.css';

const AdminComplaints = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get data from Redux store
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
    console.log('Complaints component mounted, fetching complaints...');
    dispatch(fetchComplaints());
  }, [dispatch]);

  // Debug logging
  useEffect(() => {
    console.log('Redux State:', { 
      loading, 
      error, 
      complaintsCount: filteredComplaints.length,
      stats 
    });
  }, [loading, error, filteredComplaints, stats]);

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
      case 'Pending': return 'status-pending';
      case 'Under Review': return 'status-review';
      case 'Resolved': return 'status-resolved';
      case 'Rejected': return 'status-rejected';
      default: return '';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'Low': return 'priority-low';
      case 'Medium': return 'priority-medium';
      case 'High': return 'priority-high';
      case 'Critical': return 'priority-critical';
      default: return '';
    }
  };

  const content = (
    <div className="admin-complaints-container">
      {/* Statistics Cards */}
      <div className="stats-section">
        <div className="stat-card stat-total">
          <i className="fas fa-clipboard-list"></i>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Complaints</p>
          </div>
        </div>
        <div className="stat-card stat-pending">
          <i className="fas fa-clock"></i>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card stat-review">
          <i className="fas fa-eye"></i>
          <div className="stat-content">
            <h3>{stats.underReview}</h3>
            <p>Under Review</p>
          </div>
        </div>
        <div className="stat-card stat-resolved">
          <i className="fas fa-check-circle"></i>
          <div className="stat-content">
            <h3>{stats.resolved}</h3>
            <p>Resolved</p>
          </div>
        </div>
        <div className="stat-card stat-rejected">
          <i className="fas fa-times-circle"></i>
          <div className="stat-content">
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by subject, name, type, or job..."
            value={reduxSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <div className="search-stats">
          <span>Showing: {filteredComplaints.length} of {stats.total}</span>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Complainant:</label>
          <select value={filters.complainantType} onChange={(e) => handleFilterChange('complainantType', e.target.value)}>
            <option value="All">All</option>
            <option value="Freelancer">Freelancer</option>
            <option value="Employer">Employer</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Priority:</label>
          <select value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)}>
            <option value="All">All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Sort By:</label>
          <select value={sortBy} onChange={(e) => dispatch(setSortBy(e.target.value))}>
            <option value="date">Date</option>
            <option value="priority">Priority</option>
            <option value="status">Status</option>
            <option value="complainant">Complainant</option>
          </select>
        </div>
        <div className="filter-group">
          <button 
            className="sort-order-btn" 
            onClick={() => dispatch(toggleSortOrder())}
            title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
          >
            <i className={`fas fa-sort-amount-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>
            {sortOrder === 'asc' ? ' Ascending' : ' Descending'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading complaints...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Error loading complaints</h3>
          <p>{error}</p>
          <button onClick={() => dispatch(fetchComplaints())} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* No Complaints State */}
      {!loading && !error && filteredComplaints.length === 0 && (
        <div className="no-complaints-container">
          <i className="fas fa-check-circle"></i>
          <h3>No complaints found</h3>
          <p>There are no complaints matching your filters.</p>
        </div>
      )}

      {/* Complaints Table */}
      {!loading && !error && filteredComplaints.length > 0 && (
        <div className="complaints-table-container">
          <table className="complaints-table">
            <thead>
              <tr>
                <th onClick={() => handleSortChange('complainant')} style={{ cursor: 'pointer' }}>
                  Filed By {sortBy === 'complainant' && <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                </th>
                <th>Against</th>
                <th>Job</th>
                <th>Type</th>
                <th onClick={() => handleSortChange('priority')} style={{ cursor: 'pointer' }}>
                  Priority {sortBy === 'priority' && <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                </th>
                <th>Subject</th>
                <th onClick={() => handleSortChange('status')} style={{ cursor: 'pointer' }}>
                  Status {sortBy === 'status' && <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                </th>
                <th onClick={() => handleSortChange('date')} style={{ cursor: 'pointer' }}>
                  Created {sortBy === 'date' && <i className={`fas fa-sort-${sortOrder === 'asc' ? 'up' : 'down'}`}></i>}
                </th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.map((complaint) => (
                <tr key={complaint.complaintId}>
                  <td>
                    <div className="complainant-cell">
                      <span className={`type-badge ${complaint.complainantType === 'Freelancer' ? 'type-freelancer' : 'type-employer'}`}>
                        {complaint.complainantType}
                      </span>
                      <span>{complaint.complainantName}</span>
                    </div>
                  </td>
                  <td>{complaint.complainantType === 'Freelancer' ? complaint.employerName : complaint.freelancerName}</td>
                  <td className="job-title">{complaint.jobTitle}</td>
                  <td>{complaint.complaintType}</td>
                  <td>
                    <span className={`priority-badge ${getPriorityBadgeClass(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                  </td>
                  <td className="subject-cell">{complaint.subject}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </td>
                  <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() => handleViewComplaint(complaint.complaintId)}
                    >
                      <i className="fas fa-eye"></i> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <DashboardPage title="Complaints">
      {content}
    </DashboardPage>
  );
};

export default AdminComplaints;


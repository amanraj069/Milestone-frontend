import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import './Complaints.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const AdminComplaints = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterComplainantType, setFilterComplainantType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/complaints`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setComplaints(response.data.complaints || []);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      setError('Failed to load complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewComplaint = (complaintId) => {
    navigate(`/admin/complaints/${complaintId}`);
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

  const filteredComplaints = complaints.filter(complaint => {
    const statusMatch = filterStatus === 'All' || complaint.status === filterStatus;
    const priorityMatch = filterPriority === 'All' || complaint.priority === filterPriority;
    const complainantMatch = filterComplainantType === 'All' || complaint.complainantType === filterComplainantType;
    const searchMatch = searchTerm === '' || 
      complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.complainantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.complaintType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      complaint.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && priorityMatch && complainantMatch && searchMatch;
  });

  const content = (
    <div className="admin-complaints-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Complaints Management</h1>
          <p className="page-subtitle">Review and manage freelancer complaints</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by subject, name, type, or job..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="search-stats">
          <span>Total: {filteredComplaints.length}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Complainant:</label>
          <select value={filterComplainantType} onChange={(e) => setFilterComplainantType(e.target.value)}>
            <option value="All">All</option>
            <option value="Freelancer">Freelancer</option>
            <option value="Employer">Employer</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Priority:</label>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
            <option value="All">All</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
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
          <button onClick={fetchComplaints} className="retry-btn">
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
                <th>Filed By</th>
                <th>Against</th>
                <th>Job</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Created</th>
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

  return <DashboardPage title="Complaints">{content}</DashboardPage>;
};

export default AdminComplaints;


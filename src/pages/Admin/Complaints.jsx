import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardPage from '../../components/DashboardPage';
import './Complaints.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterComplainantType, setFilterComplainantType] = useState('All');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

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

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setAdminNotes(complaint.adminNotes || '');
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedComplaint) return;

    setUpdating(true);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/complaints/${selectedComplaint.complaintId}`,
        { status, adminNotes },
        { withCredentials: true }
      );

      if (response.data.success) {
        // Update local state
        setComplaints(complaints.map(c => 
          c.complaintId === selectedComplaint.complaintId 
            ? { ...c, status, adminNotes, updatedAt: new Date() }
            : c
        ));
        setIsModalOpen(false);
        setSelectedComplaint(null);
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert('Failed to update complaint status');
    } finally {
      setUpdating(false);
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

  const filteredComplaints = complaints.filter(complaint => {
    const statusMatch = filterStatus === 'All' || complaint.status === filterStatus;
    const priorityMatch = filterPriority === 'All' || complaint.priority === filterPriority;
    const complainantMatch = filterComplainantType === 'All' || complaint.complainantType === filterComplainantType;
    return statusMatch && priorityMatch && complainantMatch;
  });

  const content = (
    <div className="admin-complaints-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Complaints Management</h1>
          <p className="page-subtitle">Review and manage freelancer complaints</p>
        </div>
        <button className="refresh-btn" onClick={fetchComplaints}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
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
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div className="filter-stats">
          <span>Total: {filteredComplaints.length}</span>
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
                <th>ID</th>
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
                  <td className="complaint-id">{complaint.complaintId.substring(0, 8)}...</td>
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
                      onClick={() => handleViewComplaint(complaint)}
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

      {/* Complaint Detail Modal */}
      {isModalOpen && selectedComplaint && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Complaint Details</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-body">
              <div className="complaint-detail-section">
                <h3>Complaint Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Complaint ID:</strong>
                    <span>{selectedComplaint.complaintId}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Status:</strong>
                    <span className={`status-badge ${getStatusBadgeClass(selectedComplaint.status)}`}>
                      {selectedComplaint.status}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Priority:</strong>
                    <span className={`priority-badge ${getPriorityBadgeClass(selectedComplaint.priority)}`}>
                      {selectedComplaint.priority}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Type:</strong>
                    <span>{selectedComplaint.complaintType}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Created:</strong>
                    <span>{new Date(selectedComplaint.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Last Updated:</strong>
                    <span>{new Date(selectedComplaint.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="complaint-detail-section">
                <h3>Parties Involved</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Filed By:</strong>
                    <span>
                      <span className={`type-badge ${selectedComplaint.complainantType === 'Freelancer' ? 'type-freelancer' : 'type-employer'}`}>
                        {selectedComplaint.complainantType}
                      </span>
                      {' '}{selectedComplaint.complainantName}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Freelancer:</strong>
                    <span>{selectedComplaint.freelancerName}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Employer:</strong>
                    <span>{selectedComplaint.employerName}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Job Title:</strong>
                    <span>{selectedComplaint.jobTitle}</span>
                  </div>
                </div>
              </div>

              <div className="complaint-detail-section">
                <h3>Subject</h3>
                <p className="complaint-subject">{selectedComplaint.subject}</p>
              </div>

              <div className="complaint-detail-section">
                <h3>Description</h3>
                <p className="complaint-description">{selectedComplaint.description}</p>
              </div>

              <div className="complaint-detail-section">
                <h3>Admin Notes</h3>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this complaint..."
                  rows="4"
                  className="admin-notes-textarea"
                />
              </div>

              <div className="modal-actions">
                <button
                  className="status-btn chat-btn-action"
                  onClick={() => alert('Chat functionality will be implemented soon')}
                >
                  <i className="fas fa-comment"></i> Chat
                </button>
                <button
                  className="status-btn pending-btn"
                  onClick={() => handleUpdateStatus('Pending')}
                  disabled={updating || selectedComplaint.status === 'Pending'}
                >
                  Mark as Pending
                </button>
                <button
                  className="status-btn review-btn"
                  onClick={() => handleUpdateStatus('Under Review')}
                  disabled={updating || selectedComplaint.status === 'Under Review'}
                >
                  Under Review
                </button>
                <button
                  className="status-btn resolved-btn"
                  onClick={() => handleUpdateStatus('Resolved')}
                  disabled={updating || selectedComplaint.status === 'Resolved'}
                >
                  Mark as Resolved
                </button>
                <button
                  className="status-btn rejected-btn"
                  onClick={() => handleUpdateStatus('Rejected')}
                  disabled={updating || selectedComplaint.status === 'Rejected'}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return <DashboardPage title="Complaints">{content}</DashboardPage>;
};

export default AdminComplaints;


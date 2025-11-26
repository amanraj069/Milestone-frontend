import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import '../Freelancer/ComplaintForm.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const ComplaintDetail = () => {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchComplaintDetail();
  }, [complaintId]);

  const fetchComplaintDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/complaints`,
        { withCredentials: true }
      );

      if (response.data.success) {
        const foundComplaint = response.data.complaints.find(
          c => c.complaintId === complaintId
        );
        if (foundComplaint) {
          setComplaint(foundComplaint);
          setAdminNotes(foundComplaint.adminNotes || '');
        } else {
          setError('Complaint not found');
        }
      }
    } catch (error) {
      console.error('Error fetching complaint:', error);
      setError('Failed to load complaint details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!complaint) return;

    setUpdating(true);
    setSuccessMessage('');
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/admin/complaints/${complaint.complaintId}`,
        { status, adminNotes },
        { withCredentials: true }
      );

      if (response.data.success) {
        setComplaint({ ...complaint, status, adminNotes, updatedAt: new Date() });
        setSuccessMessage(`Complaint status updated to ${status} successfully!`);
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
      setError('Failed to update complaint status');
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

  const content = (
    <div className="complaint-form-container">
      {/* Page Header */}
      <div className="complaint-header">
        <button className="back-btn" onClick={() => navigate('/admin/complaints')}>
          <i className="fas fa-arrow-left"></i> Back to Complaints
        </button>
        <h1 className="page-title">Complaint Details</h1>
        <p className="page-subtitle">Review and manage complaint</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'white', borderRadius: '8px' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#007bff' }}></i>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading complaint details...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Complaint Details */}
      {!loading && !error && complaint && (
        <>
          {/* Complaint Info Card */}
          <div className="job-info-card">
            <div className="job-info-header">
              <i className="fas fa-file-alt"></i>
              <span>Complaint Information</span>
            </div>
            <div className="job-info-content">
              <div className="job-info-item">
                <strong>Filed By:</strong>
                <span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    marginRight: '0.5rem',
                    background: complaint.complainantType === 'Freelancer' ? '#e3f2fd' : '#fff3e0',
                    color: complaint.complainantType === 'Freelancer' ? '#1565c0' : '#e65100'
                  }}>
                    {complaint.complainantType}
                  </span>
                  {complaint.complainantName}
                </span>
              </div>
              <div className="job-info-item">
                <strong>Freelancer:</strong>
                <span>{complaint.freelancerName}</span>
              </div>
              <div className="job-info-item">
                <strong>Employer:</strong>
                <span>{complaint.employerName}</span>
              </div>
              <div className="job-info-item">
                <strong>Job Title:</strong>
                <span>{complaint.jobTitle}</span>
              </div>
              <div className="job-info-item">
                <strong>Status:</strong>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  background: complaint.status === 'Pending' ? '#ffe0b2' : 
                             complaint.status === 'Under Review' ? '#b2ebf2' : 
                             complaint.status === 'Resolved' ? '#c8e6c9' : '#ffcdd2',
                  color: complaint.status === 'Pending' ? '#e65100' : 
                         complaint.status === 'Under Review' ? '#006064' : 
                         complaint.status === 'Resolved' ? '#2e7d32' : '#b71c1c'
                }}>
                  {complaint.status}
                </span>
              </div>
              <div className="job-info-item">
                <strong>Priority:</strong>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  background: complaint.priority === 'Low' ? '#cfe2ff' : 
                             complaint.priority === 'Medium' ? '#fff3cd' : '#f8d7da',
                  color: complaint.priority === 'Low' ? '#084298' : 
                         complaint.priority === 'Medium' ? '#997404' : '#842029'
                }}>
                  {complaint.priority}
                </span>
              </div>
              <div className="job-info-item">
                <strong>Type:</strong>
                <span>{complaint.complaintType}</span>
              </div>
              <div className="job-info-item">
                <strong>Created:</strong>
                <span>{new Date(complaint.createdAt).toLocaleString()}</span>
              </div>
              <div className="job-info-item">
                <strong>Last Updated:</strong>
                <span>{new Date(complaint.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Complaint Form */}
          <form className="complaint-form">
            {/* Subject */}
            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                value={complaint.subject}
                readOnly
                style={{ background: '#f8f9fa', cursor: 'default' }}
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={complaint.description}
                readOnly
                rows="8"
                style={{ background: '#f8f9fa', cursor: 'default' }}
              />
            </div>

            {/* Admin Notes */}
            <div className="form-group">
              <label htmlFor="adminNotes">
                Admin Notes <span className="required">*</span>
              </label>
              <textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this complaint..."
                rows="4"
              />
            </div>

            {/* Action Buttons */}
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => alert('Chat functionality will be implemented soon')}
              >
                <i className="fas fa-comment"></i> Chat
              </button>
              <button
                type="button"
                className="submit-btn"
                onClick={() => handleUpdateStatus('Pending')}
                disabled={updating || complaint.status === 'Pending' || complaint.status === 'Resolved' || complaint.status === 'Rejected'}
                style={{
                  background: complaint.status === 'Pending' || complaint.status === 'Resolved' || complaint.status === 'Rejected' ? '#ccc' : '#ffc107',
                  color: '#000'
                }}
              >
                {updating ? <i className="fas fa-spinner fa-spin"></i> : 'Mark as Pending'}
              </button>
              <button
                type="button"
                className="submit-btn"
                onClick={() => handleUpdateStatus('Under Review')}
                disabled={updating || complaint.status === 'Under Review' || complaint.status === 'Resolved' || complaint.status === 'Rejected'}
                style={{
                  background: complaint.status === 'Under Review' || complaint.status === 'Resolved' || complaint.status === 'Rejected' ? '#ccc' : '#17a2b8'
                }}
              >
                {updating ? <i className="fas fa-spinner fa-spin"></i> : 'Under Review'}
              </button>
              <button
                type="button"
                className="submit-btn"
                onClick={() => handleUpdateStatus('Resolved')}
                disabled={updating || complaint.status === 'Resolved' || complaint.status === 'Rejected'}
                style={{
                  background: complaint.status === 'Resolved' || complaint.status === 'Rejected' ? '#ccc' : '#28a745'
                }}
              >
                {updating ? <i className="fas fa-spinner fa-spin"></i> : 'Mark as Resolved'}
              </button>
              <button
                type="button"
                className="submit-btn"
                onClick={() => handleUpdateStatus('Rejected')}
                disabled={updating || complaint.status === 'Rejected' || complaint.status === 'Resolved'}
                style={{
                  background: complaint.status === 'Rejected' || complaint.status === 'Resolved' ? '#ccc' : '#dc3545'
                }}
              >
                {updating ? <i className="fas fa-spinner fa-spin"></i> : 'Reject'}
              </button>
            </div>
          </form>

          {/* Help Text */}
          <div className="help-text">
            <i className="fas fa-info-circle"></i>
            <p>
              Review the complaint details and update the status accordingly. Add admin notes to track your actions and decisions. The complainant will be notified of status changes.
            </p>
          </div>
        </>
      )}
    </div>
  );

  return <DashboardPage title="Complaint Details">{content}</DashboardPage>;
};

export default ComplaintDetail;

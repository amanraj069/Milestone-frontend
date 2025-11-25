import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import DashboardPage from '../../../components/DashboardPage';
import './ComplaintForm.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const EmployerComplaintForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const freelancer = location.state?.freelancer;

  const [formData, setFormData] = useState({
    jobId: freelancer?.jobId || '',
    freelancerId: freelancer?.freelancerId || '',
    complaintType: '',
    priority: 'Medium',
    subject: '',
    description: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!freelancer) {
      navigate('/employer/current-jobs');
    }
  }, [freelancer, navigate]);

  const complaintTypes = [
    'Payment Issue',
    'Communication Issue',
    'Scope Creep',
    'Contract Violation',
    'Harassment',
    'Poor Quality Work',
    'Missed Deadlines',
    'Other',
  ];

  const priorities = ['Low', 'Medium', 'High', 'Critical'];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.complaintType) {
      newErrors.complaintType = 'Please select a complaint type';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.length < 10) {
      newErrors.subject = 'Subject must be at least 10 characters';
    } else if (formData.subject.length > 200) {
      newErrors.subject = 'Subject must not exceed 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/employer/complaints`,
        formData,
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccessMessage('Complaint submitted successfully! Redirecting...');
        setTimeout(() => {
          navigate('/employer/current-jobs');
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setErrors({
        submit: error.response?.data?.error || 'Failed to submit complaint. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/employer/current-jobs');
  };

  if (!freelancer) {
    return null;
  }

  const content = (
    <div className="complaint-form-container">
      {/* Page Header */}
      <div className="complaint-header">
        <button className="back-btn" onClick={handleCancel}>
          <i className="fas fa-arrow-left"></i> Back to Current Jobs
        </button>
        <h1 className="page-title">Raise a Complaint</h1>
        <p className="page-subtitle">Submit a complaint about a freelancer's work</p>
      </div>

      {/* Freelancer Info Card */}
      <div className="job-info-card">
        <div className="job-info-header">
          <i className="fas fa-user"></i>
          <span>Complaint Against Freelancer</span>
        </div>
        <div className="job-info-content">
          <div className="job-info-item">
            <strong>Freelancer Name:</strong>
            <span>{freelancer.name}</span>
          </div>
          <div className="job-info-item">
            <strong>Job Title:</strong>
            <span>{freelancer.jobTitle}</span>
          </div>
          <div className="job-info-item">
            <strong>Working Since:</strong>
            <span>{freelancer.daysSinceStart} days</span>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <span>{errors.submit}</span>
        </div>
      )}

      {/* Complaint Form */}
      <form className="complaint-form" onSubmit={handleSubmit}>
        {/* Complaint Type */}
        <div className="form-group">
          <label htmlFor="complaintType">
            Complaint Type <span className="required">*</span>
          </label>
          <select
            id="complaintType"
            name="complaintType"
            value={formData.complaintType}
            onChange={handleChange}
            className={errors.complaintType ? 'error' : ''}
          >
            <option value="">Select a complaint type</option>
            {complaintTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.complaintType && (
            <span className="error-text">{errors.complaintType}</span>
          )}
        </div>

        {/* Priority */}
        <div className="form-group">
          <label htmlFor="priority">
            Priority <span className="required">*</span>
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
          >
            {priorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div className="form-group">
          <label htmlFor="subject">
            Subject <span className="required">*</span>
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="Brief summary of your complaint (10-200 characters)"
            maxLength="200"
            className={errors.subject ? 'error' : ''}
          />
          <div className="char-count">
            {formData.subject.length}/200 characters
          </div>
          {errors.subject && <span className="error-text">{errors.subject}</span>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">
            Description <span className="required">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Provide detailed information about your complaint (minimum 50 characters)"
            rows="8"
            className={errors.description ? 'error' : ''}
          ></textarea>
          <div className="char-count">
            {formData.description.length} characters (minimum 50 required)
          </div>
          {errors.description && (
            <span className="error-text">{errors.description}</span>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Submitting...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane"></i> Submit Complaint
              </>
            )}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="help-text">
        <i className="fas fa-info-circle"></i>
        <p>
          Your complaint will be reviewed by our admin team. We aim to respond within 2-3
          business days. For urgent matters, please mark the priority as "Critical".
        </p>
      </div>
    </div>
  );

  return <DashboardPage title="Raise Complaint">{content}</DashboardPage>;
};

export default EmployerComplaintForm;

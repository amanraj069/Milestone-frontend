import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DashboardPage from '../../components/DashboardPage';
import './JobListings.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const AdminJobListings = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching jobs from:', `${API_BASE_URL}/api/admin/jobs`);
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/jobs`,
        { withCredentials: true }
      );
      console.log('Jobs response:', response.data);

      if (response.data.success) {
        setJobs(response.data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      console.error('Error details:', error.response?.data);
      setError('Failed to load job listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId, title) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete job "${title}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeleting(jobId);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/jobs/${jobId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setJobs(jobs.filter(j => j.jobId !== jobId));
        alert('Job listing deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job listing. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleViewJob = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.employerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const content = (
    <div className="admin-jobs-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Job Listings Management</h1>
          <p className="page-subtitle">View and manage all job postings</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by title, employer, company, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="search-stats">
          <span>Total: {filteredJobs.length}</span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading jobs...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Error loading jobs</h3>
          <p>{error}</p>
          <button onClick={fetchJobs} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* No Jobs State */}
      {!loading && !error && filteredJobs.length === 0 && (
        <div className="no-jobs-container">
          <i className="fas fa-briefcase"></i>
          <h3>No jobs found</h3>
          <p>{searchTerm ? 'No jobs match your search.' : 'There are no job listings.'}</p>
        </div>
      )}

      {/* Jobs Table */}
      {!loading && !error && filteredJobs.length > 0 && (
        <div className="jobs-table-container">
          <table className="jobs-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Company</th>
                <th>Budget</th>
                <th>Type</th>
                <th>Status</th>
                <th>Posted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.jobId}>
                  <td className="job-title-cell">{job.title}</td>
                  <td>{job.companyName}</td>
                  <td className="budget-cell">Rs.{Number(job.budget || 0).toFixed(2)}</td>
                  <td>
                    <span className="job-type-badge">{job.jobType}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${job.status}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>{new Date(job.postedDate).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => handleViewJob(job.jobId)}
                        title="View job details"
                      >
                        <i className="fas fa-eye"></i> View
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteJob(job.jobId, job.title)}
                        disabled={deleting === job.jobId}
                        title="Delete job"
                      >
                        {deleting === job.jobId ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <>
                            <i className="fas fa-trash"></i> Delete
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return <DashboardPage title="Job Listings">{content}</DashboardPage>;
};

export default AdminJobListings;


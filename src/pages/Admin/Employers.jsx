import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardPage from '../../components/DashboardPage';
import './Employers.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const AdminEmployers = () => {
  const [employers, setEmployers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchEmployers();
  }, []);

  const fetchEmployers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/employers`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setEmployers(response.data.employers || []);
      }
    } catch (error) {
      console.error('Error fetching employers:', error);
      setError('Failed to load employers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmployer = async (employerId, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete employer "${name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeleting(employerId);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/employers/${employerId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setEmployers(employers.filter(e => e.employerId !== employerId));
        alert('Employer deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting employer:', error);
      alert('Failed to delete employer. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleChat = (employer) => {
    alert(`Chat functionality will be implemented soon for ${employer.name}`);
  };

  const filteredEmployers = employers.filter(employer =>
    employer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employer.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const content = (
    <div className="admin-employers-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Employers Management</h1>
          <p className="page-subtitle">View and manage all registered employers</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="search-stats">
          <span>Total: {filteredEmployers.length}</span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading employers...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Error loading employers</h3>
          <p>{error}</p>
          <button onClick={fetchEmployers} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* No Employers State */}
      {!loading && !error && filteredEmployers.length === 0 && (
        <div className="no-employers-container">
          <i className="fas fa-briefcase"></i>
          <h3>No employers found</h3>
          <p>{searchTerm ? 'No employers match your search.' : 'There are no registered employers.'}</p>
        </div>
      )}

      {/* Employers Table */}
      {!loading && !error && filteredEmployers.length > 0 && (
        <div className="employers-table-container">
          <table className="employers-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Company</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployers.map((employer) => (
                <tr key={employer.employerId}>
                  <td>
                    <img
                      src={employer.picture}
                      alt={employer.name}
                      className="profile-pic"
                      onError={(e) => {
                        e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png';
                      }}
                    />
                  </td>
                  <td className="name-cell">{employer.name}</td>
                  <td>{employer.companyName || 'N/A'}</td>
                  <td>{employer.email}</td>
                  <td>{employer.phone || 'N/A'}</td>
                  <td>{new Date(employer.joinedDate).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="chat-btn"
                        onClick={() => handleChat(employer)}
                        title="Chat with employer"
                      >
                        <i className="fas fa-comment"></i> Chat
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteEmployer(employer.employerId, employer.name)}
                        disabled={deleting === employer.employerId}
                        title="Delete employer"
                      >
                        {deleting === employer.employerId ? (
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

  return <DashboardPage title="Employers">{content}</DashboardPage>;
};

export default AdminEmployers;


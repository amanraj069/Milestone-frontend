import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardPage from '../../components/DashboardPage';
import './Freelancers.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const AdminFreelancers = () => {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchFreelancers();
  }, []);

  const fetchFreelancers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        `${API_BASE_URL}/api/admin/freelancers`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setFreelancers(response.data.freelancers || []);
      }
    } catch (error) {
      console.error('Error fetching freelancers:', error);
      setError('Failed to load freelancers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFreelancer = async (freelancerId, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete freelancer "${name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeleting(freelancerId);
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/admin/freelancers/${freelancerId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setFreelancers(freelancers.filter(f => f.freelancerId !== freelancerId));
        alert('Freelancer deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting freelancer:', error);
      alert('Failed to delete freelancer. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleChat = (freelancer) => {
    alert(`Chat functionality will be implemented soon for ${freelancer.name}`);
  };

  const filteredFreelancers = freelancers.filter(freelancer =>
    freelancer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    freelancer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    freelancer.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const content = (
    <div className="admin-freelancers-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Freelancers Management</h1>
          <p className="page-subtitle">View and manage all registered freelancers</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-section">
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search by name, email, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="search-stats">
          <span>Total: {filteredFreelancers.length}</span>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading freelancers...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Error loading freelancers</h3>
          <p>{error}</p>
          <button onClick={fetchFreelancers} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* No Freelancers State */}
      {!loading && !error && filteredFreelancers.length === 0 && (
        <div className="no-freelancers-container">
          <i className="fas fa-users"></i>
          <h3>No freelancers found</h3>
          <p>{searchTerm ? 'No freelancers match your search.' : 'There are no registered freelancers.'}</p>
        </div>
      )}

      {/* Freelancers Table */}
      {!loading && !error && filteredFreelancers.length > 0 && (
        <div className="freelancers-table-container">
          <table className="freelancers-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFreelancers.map((freelancer) => (
                <tr key={freelancer.freelancerId}>
                  <td>
                    <img
                      src={freelancer.picture}
                      alt={freelancer.name}
                      className="profile-pic"
                      onError={(e) => {
                        e.target.src = 'https://cdn.pixabay.com/photo/2018/04/18/18/56/user-3331256_1280.png';
                      }}
                    />
                  </td>
                  <td className="name-cell">{freelancer.name}</td>
                  <td>{freelancer.email}</td>
                  <td>{freelancer.phone || 'N/A'}</td>
                  <td>{new Date(freelancer.joinedDate).toLocaleDateString()}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="chat-btn"
                        onClick={() => handleChat(freelancer)}
                        title="Chat with freelancer"
                      >
                        <i className="fas fa-comment"></i> Chat
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteFreelancer(freelancer.freelancerId, freelancer.name)}
                        disabled={deleting === freelancer.freelancerId}
                        title="Delete freelancer"
                      >
                        {deleting === freelancer.freelancerId ? (
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

  return <DashboardPage title="Freelancers">{content}</DashboardPage>;
};

export default AdminFreelancers;


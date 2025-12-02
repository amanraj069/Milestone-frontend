import React, { useState, useEffect } from 'react';
import DashboardPage from '../../../components/DashboardPage';
import ApplicationDetailsModal from './ApplicationDetailsModal';
import axios from 'axios';
import './Applications.css';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const EmployerApplications = () => {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/employer/job_applications/api/data`, {
        withCredentials: true
      });

      if (response.data.success) {
        setApplications(response.data.data.applications);
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      alert('Failed to fetch applications. Please make sure you are logged in as an employer.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (applicationId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/employer/job_applications/${applicationId}/accept`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        alert('Application accepted successfully!');
        fetchApplications();
      }
    } catch (error) {
      console.error('Error accepting application:', error);
      alert('Failed to accept application');
    }
  };

  const handleReject = async (applicationId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/employer/job_applications/${applicationId}/reject`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        alert('Application rejected successfully!');
        fetchApplications();
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('Failed to reject application');
    }
  };

  const handleViewResume = (resumeUrl) => {
    // Convert relative path to full URL if needed
    let fullUrl = resumeUrl;
    if (resumeUrl.startsWith('/uploads')) {
      fullUrl = `${API_BASE_URL}${resumeUrl}`;
    }
    window.open(fullUrl, '_blank');
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetailsModal(true);
  };

  const filteredApplications = applications.filter(app => 
    app.freelancerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusMap = {
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'PENDING' },
      'Accepted': { bg: 'bg-green-100', text: 'text-green-700', label: 'ACCEPTED' },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-700', label: 'REJECTED' }
    };
    
    const statusStyle = statusMap[status] || statusMap['Pending'];
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
        {statusStyle.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  };

  return (
    <DashboardPage title="Applications">
      <div className="space-y-6">
        {/* Header */}
          <p className="text-gray-600">Review and manage applications for your job listings</p>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{stats.total}</div>
            <div className="text-gray-600 text-sm">Total Applications</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{stats.pending}</div>
            <div className="text-gray-600 text-sm">Pending Review</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{stats.accepted}</div>
            <div className="text-gray-600 text-sm">Accepted</div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">{stats.rejected}</div>
            <div className="text-gray-600 text-sm">Rejected</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search applications, freelancers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-600">No applications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <div 
                  key={application.applicationId} 
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Profile Picture */}
                    <div className="flex-shrink-0">
                      <img
                        src={application.freelancerPicture || '/default-avatar.png'}
                        alt={application.freelancerName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                    </div>

                    {/* Application Details */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {application.freelancerName || 'Unknown Applicant'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Applied for: <span className="font-medium text-blue-600">{application.jobTitle}</span>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Applied on: {formatDate(application.appliedDate)}
                          </p>
                        </div>
                        <div>
                          {getStatusBadge(application.status)}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          onClick={() => handleViewDetails(application)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <i className="fas fa-eye mr-2"></i>
                          View Application
                        </button>
                        
                        {application.resumeLink && (
                          <button
                            onClick={() => handleViewResume(application.resumeLink)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                          >
                            <i className="fas fa-file-pdf mr-2"></i>
                            View Resume
                          </button>
                        )}

                        {application.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleAccept(application.applicationId)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              <i className="fas fa-check mr-2"></i>
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(application.applicationId)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                              <i className="fas fa-times mr-2"></i>
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedApplication(null);
          }}
        />
      )}
    </DashboardPage>
  );
};

export default EmployerApplications;

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardPage from '../../../components/DashboardPage';
import ApplicationDetailsModal from '../../../components/employer/ApplicationDetailsModal';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:9000';

const EmployerApplications = () => {
  const [searchParams] = useSearchParams();
  const jobIdFilter = searchParams.get('jobId');
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

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.freelancerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesJobId = !jobIdFilter || app.jobId === jobIdFilter;
    return matchesSearch && matchesJobId;
  });

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
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-file-alt text-blue-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Applications</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-clock text-yellow-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Pending Review</p>
                <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Accepted</p>
                <p className="text-2xl font-bold text-gray-800">{stats.accepted}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <i className="fas fa-times-circle text-red-600 text-xl"></i>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Rejected</p>
                <p className="text-2xl font-bold text-gray-800">{stats.rejected}</p>
              </div>
            </div>
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
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              />
            </div>
            <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>

        {/* Applications List - Table Layout */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
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
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Freelancer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Job Details
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider" colSpan="2">
                      Applied Details
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider" style={{width: '140px'}}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredApplications.map((application) => (
                    <tr 
                      key={application.applicationId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Freelancer Column */}
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            {application.freelancerPicture ? (
                              <img
                                className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md"
                                src={application.freelancerPicture}
                                alt={application.freelancerName}
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                                {application.freelancerName?.charAt(0)?.toUpperCase() || 'F'}
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {application.freelancerName || 'Unknown Applicant'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {application.freelancerEmail || 'No email'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Job Details Column */}
                      <td className="px-6 py-5">
                        <div className="text-sm font-semibold text-gray-900 mb-1">
                          {application.jobTitle}
                        </div>
                        <div className="text-sm text-gray-500">
                          Applied on: {formatDate(application.appliedDate)}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-5 text-center">
                        {getStatusBadge(application.status)}
                      </td>

                      {/* Applied Details - View Application */}
                      <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => handleViewDetails(application)}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <i className="fas fa-eye mr-2"></i>
                          View Application
                        </button>
                      </td>

                      {/* Applied Details - View Resume */}
                      <td className="px-6 py-5 text-center">
                        {application.resumeLink ? (
                          <button
                            onClick={() => handleViewResume(application.resumeLink)}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <i className="fas fa-file-pdf mr-2"></i>
                            View Resume
                          </button>
                        ) : (
                          <span className="text-sm text-gray-400">No resume</span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-5">
                        {application.status === 'Pending' ? (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleAccept(application.applicationId)}
                              className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                            >
                              <i className="fas fa-check mr-2"></i>
                              Accept
                            </button>
                            <button
                              onClick={() => handleReject(application.applicationId)}
                              className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all duration-200 shadow-sm hover:shadow-md whitespace-nowrap"
                            >
                              <i className="fas fa-times mr-2"></i>
                              Reject
                            </button>
                          </div>
                        ) : (
                          <div className="h-[88px] flex items-center justify-center">
                            <span className="text-xs text-gray-400">—</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
export { EmployerApplications };

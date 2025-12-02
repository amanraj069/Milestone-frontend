import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardPage from '../../../components/DashboardPage';

const EmployerJobListings = () => {
  const [jobListings, setJobListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Jobs');
  const [deleteModal, setDeleteModal] = useState({ show: false, jobId: null });
  const navigate = useNavigate();
  const apiBaseUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    loadJobListings();
  }, []);

  const loadJobListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/employer/job-listings`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setJobListings(data.data);
      } else {
        setError(data.error || 'Failed to load job listings');
      }
    } catch (err) {
      console.error('Error loading job listings:', err);
      setError('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/employer/job-listings/${jobId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setJobListings(jobListings.filter(job => job.jobId !== jobId));
        setDeleteModal({ show: false, jobId: null });
        showNotification('Job listing deleted successfully!', 'success');
      } else {
        showNotification(data.error || 'Failed to delete job listing', 'error');
      }
    } catch (err) {
      console.error('Error deleting job:', err);
      showNotification('Network error. Please try again.', 'error');
    }
  };

  const showNotification = (message, type) => {
    alert(message);
  };

  const getDaysAgo = (dateString) => {
    const days = Math.floor((Date.now() - new Date(dateString)) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : `${days} days ago`;
  };

  const filteredJobs = jobListings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = (() => {
      switch (activeFilter) {
        case 'All Jobs': return true;
        case 'Remote': return job.remote;
        case 'Full-time': return job.jobType === 'full-time';
        case 'Part-time': return job.jobType === 'part-time';
        default: return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardPage 
      title="Job Listings"
      headerAction={
        <Link
          to="/employer/job-listings/new"
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-600 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
        >
          <i className="fas fa-plus"></i>
          <span>Post New Job</span>
        </Link>
      }
    >
      <div className="mb-6 mt-8">
        <p className="text-gray-600">Browse and manage your posted job opportunities</p>
      </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <input
                type="text"
                placeholder="Search jobs, skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition-all"
              />
              <div className="flex gap-2 flex-wrap">
                {['All Jobs', 'Remote', 'Full-time', 'Part-time'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-full font-medium transition-all hover:cursor-pointer ${
                      activeFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <i className="fas fa-spinner fa-spin text-5xl text-blue-600 mb-4"></i>
                <p className="text-gray-600 text-lg">Loading job listings...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <i className="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Job Listings</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadJobListings}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-all"
                >
                  <i className="fas fa-refresh mr-2"></i>
                  Try Again
                </button>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <i className="fas fa-briefcase text-5xl text-gray-300 mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Job Listings Found</h3>
                <p className="text-gray-600 mb-4">
                  {jobListings.length === 0 
                    ? 'Start by posting your first job opportunity!' 
                    : 'Try adjusting your search or filter criteria'}
                </p>
                {jobListings.length === 0 && (
                  <Link
                    to="/employer/job-listings/new"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Post New Job
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map(job => (
                  <div
                    key={job.jobId}
                    className="border-2 border-gray-200 rounded-xl p-5 hover:border-blue-600 transition-all hover:shadow-lg flex gap-5 items-center"
                  >
                    <div className="flex-shrink-0">
                      <img
                        src={job.imageUrl || '/assets/company_logo.jpg'}
                        alt="Company"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{job.title}</h3>
                      <div className="text-blue-600 font-semibold text-lg mb-3">
                        ₹{typeof job.budget === 'number' ? job.budget.toLocaleString('en-IN') : job.budget}
                      </div>
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {job.description.skills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-4 text-gray-600 text-sm flex-wrap">
                        <span className="flex items-center gap-2">
                          <i className="fas fa-map-marker-alt text-blue-600"></i>
                          {job.location || 'Not specified'}
                        </span>
                        <span className="flex items-center gap-2">
                          <i className="fas fa-briefcase text-blue-600"></i>
                          {job.jobType}
                        </span>
                        <span className="flex items-center gap-2">
                          <i className="fas fa-calendar text-blue-600"></i>
                          Posted {getDaysAgo(job.postedDate)}
                        </span>
                        {job.remote && (
                          <span className="flex items-center gap-2 text-green-600">
                            <i className="fas fa-home"></i>
                            Remote
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex flex-col gap-2">
                      <button
                        onClick={() => navigate(`/employer/job-listings/${job.jobId}`)}
                        className="border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition-all font-medium"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => navigate(`/employer/job-listings/edit/${job.jobId}`)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all font-medium"
                      >
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button
                        onClick={() => setDeleteModal({ show: true, jobId: job.jobId })}
                        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all font-medium"
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Delete Job Listing</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this job listing? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setDeleteModal({ show: false, jobId: null })}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all font-semibold"
                >
                  <i className="fas fa-times mr-2"></i>
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteModal.jobId)}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all font-semibold"
                >
                  <i className="fas fa-check mr-2"></i>
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardPage>
  );
};

export default EmployerJobListings;
